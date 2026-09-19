// SATHI Agentic AI Orchestration Layer for ServiceAgent
import { GoogleGenAI } from '@google/genai';
import { db } from './db';
import { dispatchEngine } from './dispatch';
import { placesService } from './places';
import {
  AgentMessage,
  AgentToolCall,
  Task,
  ServiceType,
  DispatchCandidate,
  PlaceResult,
} from '../src/types';

// Initialize Gemini SDK with server-side key
let genAI: GoogleGenAI | null = null;
let geminiCooldownUntil = 0;

function getGenAI(): GoogleGenAI | null {
  if (!genAI && process.env.GEMINI_API_KEY) {
    try {
      genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (e) {
      console.warn('Failed to initialize GoogleGenAI client:', (e as any)?.message || e);
    }
  }
  return genAI;
}

// Multi-language definitions and keywords
export type SupportedLanguage = 'en' | 'te' | 'hi' | 'ta' | 'kn' | 'ml' | 'bn' | 'mr' | 'gu' | 'es' | 'fr' | 'de' | 'other';

export interface PendingConversationFlow {
  type: 'HOME_OR_TRAVEL' | 'HOSPITAL_VISIT' | 'GENERAL_SERVICE' | 'SHOPPING' | 'MEDICINE_PICKUP';
  step: 'TRANSPORT_PREF' | 'PICKUP' | 'DESTINATION' | 'TIME' | 'DURATION' | 'REQUIREMENTS' | 'CONFIRMATION';
  data: Record<string, any>;
  language?: SupportedLanguage;
}

/**
 * Detect language from text (script or transliterated keywords)
 */
export function detectLanguage(text: string): SupportedLanguage {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // 1. Script checks (Unicode ranges)
  if (/[\u0C00-\u0C7F]/.test(trimmed)) return 'te'; // Telugu
  if (/[\u0900-\u097F]/.test(trimmed)) {
    if (lower.includes('आहे') || lower.includes('करा') || lower.includes('घरी') || lower.includes('मदत')) return 'mr'; // Marathi
    return 'hi'; // Hindi
  }
  if (/[\u0B80-\u0BFF]/.test(trimmed)) return 'ta'; // Tamil
  if (/[\u0C80-\u0CFF]/.test(trimmed)) return 'kn'; // Kannada
  if (/[\u0D00-\u0D7F]/.test(trimmed)) return 'ml'; // Malayalam
  if (/[\u0980-\u09FF]/.test(trimmed)) return 'bn'; // Bengali
  if (/[\u0A80-\u0AFF]/.test(trimmed)) return 'gu'; // Gujarati

  // 2. Transliterated / Phonetic keywords
  // Telugu
  if (
    /\b(nenu|vellali|velali|intiki|aaspattri|mandulu|sahayam|kuragayalu|namaskaram|kavali|kaavali|avunu|sare|dhanyavadalu|ekkada|ekhada|unnaru|cheyyi|maku|kavalani)\b/i.test(lower)
  ) {
    return 'te';
  }

  // Hindi
  if (
    /\b(mujhe|humko|chahiye|jana hai|jaana hai|madad|karo|karidna|theek hai|dhanyavaad|shukriya|namaste|kahan|dawa|dawaii|sabzi)\b/i.test(lower)
  ) {
    return 'hi';
  }

  // Tamil
  if (
    lower.includes('enakku') ||
    lower.includes('veetuku') ||
    lower.includes('poganum') ||
    lower.includes('marundhu') ||
    lower.includes('maruthuvamanai') ||
    lower.includes('udhavi') ||
    lower.includes('nandri') ||
    lower.includes('aam')
  ) {
    return 'ta';
  }

  // Kannada
  if (
    lower.includes('nanage') ||
    lower.includes('maneghe') ||
    lower.includes('hogabeku') ||
    lower.includes('aushadhi') ||
    lower.includes('aaspithre') ||
    lower.includes('sahaya') ||
    lower.includes('dhanyavada') ||
    lower.includes('haudu')
  ) {
    return 'kn';
  }

  // Malayalam
  if (
    lower.includes('enikku') ||
    lower.includes('veettil') ||
    lower.includes('pokanam') ||
    lower.includes('marunnu') ||
    lower.includes('aashupathri') ||
    lower.includes('sahayam') ||
    lower.includes('nanni')
  ) {
    return 'ml';
  }

  // Bengali
  if (
    lower.includes('aamake') ||
    lower.includes('baari') ||
    lower.includes('jaate') ||
    lower.includes('osudh') ||
    lower.includes('shahajjo') ||
    lower.includes('dhonnobad')
  ) {
    return 'bn';
  }

  // Spanish
  if (
    lower.includes('necesito') ||
    lower.includes('ir a') ||
    lower.includes('casa') ||
    lower.includes('hospital') ||
    lower.includes('medicina') ||
    lower.includes('ayuda') ||
    lower.includes('gracias') ||
    lower.includes('por favor')
  ) {
    return 'es';
  }

  // French
  if (
    lower.includes('je dois') ||
    lower.includes('aller') ||
    lower.includes('maison') ||
    lower.includes('médicament') ||
    lower.includes('aide') ||
    lower.includes('merci') ||
    lower.includes("s'il vous plaît")
  ) {
    return 'fr';
  }

  // German
  if (
    lower.includes('ich brauche') ||
    lower.includes('nach hause') ||
    lower.includes('krankenhaus') ||
    lower.includes('medikamente') ||
    lower.includes('hilfe') ||
    lower.includes('danke') ||
    lower.includes('bitte')
  ) {
    return 'de';
  }

  return 'en';
}

/**
 * Multi-lingual message helper for Sathi
 */
export function getMultilingualPhrase(
  key: string,
  lang: SupportedLanguage,
  params: Record<string, string | number> = {}
): string {
  const dictionary: Record<string, Record<SupportedLanguage, string>> = {
    // Travel Step 1: Transport Preference
    TRAVEL_STEP_1_TRANSPORT: {
      en: "Sure! I can help you arrange that. Would you prefer a bike or a taxi?",
      te: "ఖచ్చితంగా. నేను సహాయం చేయగలను. మీకు బైక్ కావాలా లేదా టాక్సీ కావాలా?",
      hi: "ज़रूर! मैं आपके लिए यह प्रबंधित कर सकती हूँ। आप बाइक पसंद करेंगे या टैक्सी?",
      ta: "நிச்சயமாக! நான் ஏற்பாடு செய்ய உதவ முடியும். நீங்கள் பைக் விரும்புகிறீர்களா அல்லது டாக்ஸியா?",
      kn: "ಖಂಡಿತ! ನಾನು ವ್ಯವಸ್ಥೆ ಮಾಡಲು ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ನೀವು ಬೈಕ್ ಬಯಸುತ್ತೀರಾ ಅಥವಾ ಟ್ಯಾಕ್ಸಿನಾ?",
      ml: "തീർച്ചയായും! എനിക്ക് ക്രമീകരിക്കാൻ സഹായിക്കാനാകും. നിങ്ങൾക്ക് ബൈക്കാണോ ടാക്സിയാണോ വേണ്ടത്?",
      bn: "অবশ্যই! আমি এটি ব্যবস্থা করতে সাহায্য করতে পারি। আপনি কি বাইক পছন্দ করবেন নাকি ট্যাক্সি?",
      mr: "नक्कीच! मी व्यवस्था करण्यात मदत करू शकेन. तुम्हाला बाइक हवी आहे की टॅक्सी?",
      gu: "ચોક્કસ! હું વ્યવસ્થા કરવામાં મદદ કરી શકું છું. તમે બાઇક પસંદ કરશો કે ટેક્સી?",
      es: "¡Claro! Puedo ayudarte con eso. ¿Prefieres una moto o un taxi?",
      fr: "Bien sûr! Je peux vous organiser cela. Préférez-vous une moto ou un taxi?",
      de: "Sicher! Ich kann Ihnen dabei helfen. Bevorzugen Sie ein Motorrad oder ein Taxi?",
      other: "Sure! I can help you arrange that. Would you prefer a bike or a taxi?",
    },
    // Travel Step 2: Pickup
    TRAVEL_STEP_2_PICKUP: {
      en: "Okay. Where should I pick you up from?",
      te: "సరే. నేను మిమ్మల్ని ఎక్కడి నుండి పికప్ చేసుకోవాలి?",
      hi: "ठीक है। मैं आपको कहाँ से पिकअप करवाऊँ?",
      ta: "சரி. உங்களை எங்கிருந்து பிக்அப் செய்ய வேண்டும்?",
      kn: "ಸರಿ. ನಾನು ನಿಮ್ಮನ್ನು ಎಲ್ಲಿಂದ ಪಿಕಪ್ ಮಾಡಬೇಕು?",
      ml: "ശരി. നിങ്ങളെ എവിടെ നിന്നാണ് പിക്കപ്പ് ചെയ്യേണ്ടത്?",
      bn: "ঠিক আছে। আপনাকে কোথা থেকে পিকআপ করতে হবে?",
      mr: "ठीक आहे. मी तुम्हाला कुठून पिकअप करू?",
      gu: "બરાબર. હું તમને ક્યાંથી પિકઅપ કરાવું?",
      es: "De acuerdo. ¿Desde dónde deberíamos recogerte?",
      fr: "D'accord. D'où devons-nous venir vous chercher?",
      de: "In Ordnung. Wo sollen wir Sie abholen?",
      other: "Okay. Where should I pick you up from?",
    },
    // Travel Step 3: Destination
    TRAVEL_STEP_3_DEST: {
      en: "Got it. And what is your destination?",
      te: "అర్థమైంది. మీ గమ్యస్థానం ఏమిటి?",
      hi: "समझ गया। और आपका गंतव्य स्थान (destination) क्या है?",
      ta: "புரிந்தது. உங்கள் சேருமிடம் என்ன?",
      kn: "ತಿಳಿಯಿತು. ನಿಮ್ಮ ತಲುಪುವ ಸ್ಥಳ ಯಾವುದು?",
      ml: "മനസ്സിലായി. നിങ്ങളുടെ ലക്ഷ്യസ്ഥാനം എന്താണ്?",
      bn: "বুঝতে পেরেছি। আপনার গন্তব্য কোথায়?",
      mr: "समजले. तुमचे अंतिम ठिकाण कोणते आहे?",
      gu: "સમજાઈ ગયું. તમારું ગંતવ્ય સ્થાન કયું છે?",
      es: "Entendido. ¿Y cuál es tu destino?",
      fr: "Compris. Et quelle est votre destination?",
      de: "Verstanden. Und was ist Ihr Zielort?",
      other: "Got it. And what is your destination?",
    },
    // Travel Step 4: Time
    TRAVEL_STEP_4_TIME: {
      en: "Sure. What time would you like to leave?",
      te: "ఖచ్చితంగా. మీరు ఏ సమయానికి బయలుదేరాలనుకుంటున్నారు?",
      hi: "ज़रूर। आप किस समय निकलना चाहेंगे?",
      ta: "நிச்சயமாக. நீங்கள் எந்த நேரத்தில் புறப்பட விரும்புகிறீர்கள்?",
      kn: "ಖಂಡಿತ. ನೀವು ಯಾವ ಸಮಯಕ್ಕೆ ಹೊರಡಲು ಬಯಸುತ್ತೀರಿ?",
      ml: "തീർച്ചയായും. നിങ്ങൾ ഏത് സമയത്താണ് പുറപ്പെടാൻ ആഗ്രഹിക്കുന്നത്?",
      bn: "নিশ্চয়ই। আপনি কখন রওনা হতে চান?",
      mr: "नक्कीच. तुम्ही किती वाजता निघू इच्छिता?",
      gu: "ચોક્કસ. તમે કયા સમયે નીકળવા માંગો છો?",
      es: "Seguro. ¿A qué hora te gustaría salir?",
      fr: "Certainement. À quelle heure souhaitez-vous partir?",
      de: "Sicher. Um wie viel Uhr möchten Sie losfahren?",
      other: "Sure. What time would you like to leave?",
    },
    // Hospital Step 1: Time
    HOSPITAL_STEP_1_TIME: {
      en: "I can certainly arrange companion assistance and transportation for your hospital visit. When would you like to go, or what time is your appointment?",
      te: "ఖచ్చితంగా. మీ ఆసుపత్రి సందర్శనకు తోడుగా ఉండేందుకు సహాయకుడిని ఏర్పాటు చేయగలను. మీరు ఏ సమయానికి వెళ్ళాలనుకుంటున్నారు?",
      hi: "मैं निश्चित रूप से आपके अस्पताल के दौरे के लिए साथी सहायता और वाहन की व्यवस्था कर सकती हूँ। आप किस समय जाना चाहेंगे या आपका अपॉइंटमेंट कब है?",
      ta: "உங்கள் மருத்துவமனை வருகைக்கு துணை உதவி மற்றும் போக்குவரத்தை நான் ஏற்பாடு செய்ய முடியும். நீங்கள் எப்போது செல்ல விரும்புகிறீர்கள்?",
      kn: "ನಿಮ್ಮ ಆಸ್ಪತ್ರೆಯ ಭೇಟಿಗೆ ಜೊತೆಗಾರರ ​​ಸಹಾಯ ಮತ್ತು ಸಾರಿಗೆಯನ್ನು ನಾನು ಖಂಡಿತವಾಗಿಯೂ ವ್ಯವಸ್ಥೆ ಮಾಡಬಲ್ಲೆ. ನೀವು ಯಾವಾಗ ಹೋಗಲು ಬಯಸುತ್ತೀರಿ?",
      ml: "നിങ്ങളുടെ ആശുപത്രി സന്ദർശനത്തിന് കൂട്ടുകാരന്റെ സഹായവും യാത്രയും ക്രമീകരിക്കാൻ എനിക്ക് കഴിയും. നിങ്ങൾ എപ്പോഴാണ് പോകാൻ ആഗ്രഹിക്കുന്നത്?",
      bn: "আমি অবশ্যই আপনার হাসপাতাল পরিদর্শনের জন্য সহযোগী ও যাতায়াতের ব্যবস্থা করতে পারি। আপনি কখন যেতে চান?",
      mr: "मी तुमच्या हॉस्पिटलच्या भेटीसाठी साथीदार मदत आणि वाहनाची व्यवस्था करू शकते. तुम्ही किती वाजता जाऊ इच्छिता?",
      gu: "હું ચોક્કસપણે તમારી હોસ્પિટલ મુલાકાત માટે સહાયક અને વાહનની વ્યવસ્થા કરી શકું છું. તમે કયા સમયે જવા માંગો છો?",
      es: "Con gusto puedo coordinar un acompañante y transporte para tu visita al hospital. ¿A qué hora te gustaría ir?",
      fr: "Je peux tout à fait organiser un accompagnateur et le transport pour votre visite à l'hôpital. À quelle heure souhaitez-vous y aller?",
      de: "Ich kann gerne eine Begleitperson und den Transport für Ihren Krankenhausbesuch organisieren. Wann möchten Sie gehen?",
      other: "I can certainly arrange companion assistance and transportation for your hospital visit. When would you like to go, or what time is your appointment?",
    },
    // Hospital Step 2: Pickup
    HOSPITAL_STEP_2_PICKUP: {
      en: "Where should I pick you up from? Please let me know your home address or current pickup spot.",
      te: "సరే. నేను మిమ్మల్ని ఎక్కడి నుండి పికప్ చేసుకోవాలి? దయచేసి మీ పికప్ చిరునామా చెప్పండి.",
      hi: "मैं आपको कहाँ से पिकअप करवाऊँ? कृपया अपना पता या पिकअप स्थान बताएं।",
      ta: "உங்களை எங்கிருந்து பிக்அப் செய்ய வேண்டும்? தயவுசெய்து உங்கள் முகவரியைக் கூறுங்கள்.",
      kn: "ನಾನು ನಿಮ್ಮನ್ನು ಎಲ್ಲಿಂದ ಪಿಕಪ್ ಮಾಡಬೇಕು? ದಯವಿಟ್ಟು ನಿಮ್ಮ ವಿಳಾಸ ತಿಳಿಸಿ.",
      ml: "നിങ്ങളെ എവിടെ നിന്നാണ് പിക്കപ്പ് ചെയ്യേണ്ടത്? ദയവായി നിങ്ങളുടെ വിലാസം പറയുക.",
      bn: "আপনাকে কোথা থেকে পিকআপ করব? দয়া করে আপনার ঠিকানা বলুন।",
      mr: "मी तुम्हाला कुठून पिकअप करू? कृपया तुमचा पत्ता सांगा.",
      gu: "હું તમને ક્યાંથી પિકઅપ કરાવું? કૃપા કરીને તમારું સરનામું જણાવો.",
      es: "¿Desde dónde deberíamos recogerte? Indícame tu dirección o punto de partida.",
      fr: "D'où devons-nous venir vous chercher? Veuillez indiquer votre adresse.",
      de: "Wo sollen wir Sie abholen? Bitte nennen Sie mir Ihre Adresse.",
      other: "Where should I pick you up from? Please let me know your home address or current pickup spot.",
    },
    // Hospital Step 3: Destination
    HOSPITAL_STEP_3_DEST: {
      en: "Which hospital or clinic would you like to go to? We can assist you at Government Hospital, local clinics, or specialty centers.",
      te: "మీరు ఏ ఆసుపత్రికి వెళ్ళాలనుకుంటున్నారు? ప్రభుత్వ ఆసుపత్రి లేదా ప్రైవేట్ క్లినిక్?",
      hi: "आप किस अस्पताल या क्लिनिक जाना चाहते हैं? हम सरकारी अस्पताल, स्थानीय क्लिनिक या निजी अस्पतालों में सहायता कर सकते हैं।",
      ta: "நீங்கள் எந்த மருத்துவமனைக்கு செல்ல விரும்புகிறீர்கள்? அரசு மருத்துவமனையா அல்லது தனியார் கிளினிக்கா?",
      kn: "ನೀವು ಯಾವ ಆಸ್ಪತ್ರೆಗೆ ಹೋಗಲು ಬಯಸುತ್ತೀರಿ? ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆ ಅಥವಾ ಖಾಸಗಿ ಕ್ಲಿನಿಕ್?",
      ml: "നിങ്ങൾ ഏത് ആശുപത്രിയിലാണ് പോകാൻ ആഗ്രഹിക്കുന്നത്? സർക്കാർ ആശുപത്രിയോ സ്വകാര്യ ക്ലിനിക്കോ?",
      bn: "আপনি কোন হাসপাতালে যেতে চান? সরকারি হাসপাতাল নাকি বেসরকারি ক্লিনিক?",
      mr: "तुम्हाला कोणत्या हॉस्पिटलमध्ये जायचे आहे? सरकारी हॉस्पिटल की खाजगी क्लिनिक?",
      gu: "તમે કઈ હોસ્પિટલમાં જવા માંગો છો? સરકારી હોસ્પિટલ કે ખાનગી ક્લિનિક?",
      es: "¿A qué hospital o clínica te gustaría ir?",
      fr: "À quel hôpital ou clinique souhaitez-vous vous rendre?",
      de: "Zu welchem ​​Krankenhaus oder welcher Klinik möchten Sie gehen?",
      other: "Which hospital or clinic would you like to go to? We can assist you at Government Hospital, local clinics, or specialty centers.",
    },
    // Hospital Step 4: Duration
    HOSPITAL_STEP_4_DURATION: {
      en: "Approximately how long will you need the executor's assistance at the hospital? For example, about two hours or through your appointment?",
      te: "ఎగ్జిక్యూటర్ సహాయం మీకు ఎంత సమయం అవసరం అవుతుంది? ఉదాహరణకు రెండు గంటలు లేదా డాక్టర్ కన్సల్టేషన్ పూర్తయ్యే వరకు?",
      hi: "अस्पताल में आपको सहायक की मदद लगभग कितने समय के लिए चाहिए होगी? उदाहरण के लिए दो घंटे या डॉक्टर से परामर्श पूरा होने तक?",
      ta: "மருத்துவமனையில் உங்களுக்கு உதவியாளரின் உதவி எவ்வளவு நேரம் தேவைப்படும்? உதாரணமாக இரண்டு மணி நேரமா?",
      kn: "ಆಸ್ಪತ್ರೆಯಲ್ಲಿ ನಿಮಗೆ ಸಹಾಯಕರ ಸಹಾಯ ಎಷ್ಟು ಸಮಯ ಬೇಕಾಗಬಹುದು? ಉದಾಹರಣೆಗೆ ಸುಮಾರು ಎರಡು ಗಂಟೆಗಳ ಕಾಲವೇ?",
      ml: "ആശുപത്രിയിൽ നിങ്ങൾക്ക് സഹായിയുടെ സഹായം എത്ര സമയം വേണ്ടിവരും? ഉദാഹരണത്തിന് രണ്ട് മണിക്കൂറോളം?",
      bn: "হাসপাতালে আপনার কতক্ষণ সহকারীর সাহায্য প্রয়োজন হবে? যেমন প্রায় দুই ঘণ্টা?",
      mr: "हॉस्पिटलमध्ये तुम्हाला सहाय्यकाची मदत किती वेळ लागेल? उदाहरणार्थ दोन तास?",
      gu: "હોસ્પિટલમાં તમને સહાયકની કેટલી વાર જરૂર પડશે? દાખલા તરીકે બે કલાક?",
      es: "¿Aproximadamente cuánto tiempo necesitarás la asistencia de nuestro colaborador en el hospital?",
      fr: "Pendant combien de temps environ aurez-vous besoin de l'assistance de notre intervenant à l'hôpital?",
      de: "Wie lange werden Sie voraussichtlich die Unterstützung unseres Begleiters im Krankenhaus benötigen?",
      other: "Approximately how long will you need the executor's assistance at the hospital? For example, about two hours or through your appointment?",
    },
    // Generic Greeting
    GENERIC_GREETING: {
      en: "Hello! I'm Sathi, your personal voice service coordinator. What can I take care of for you today?",
      te: "నమస్కారం! నేను సాథి, మీ వ్యక్తిగత సేవా సమన్వయకర్తను. ఈరోజు నేను మీకు ఏ విధంగా సహాయపడగలను?",
      hi: "नमस्ते! मैं साथी हूँ, आपकी व्यक्तिगत सेवा समन्वयक। आज मैं आपके लिए क्या प्रबंधित करूँ?",
      ta: "வணக்கம்! நான் சாதி, உங்கள் தனிப்பட்ட சேவை ஒருங்கிணைப்பாளர். இன்று நான் உங்களுக்கு என்ன உதவி செய்ய வேண்டும்?",
      kn: "ನಮಸ್ಕಾರ! ನಾನು ಸಾಥಿ, ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಸೇವಾ ಸಂಯೋಜಕಿ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
      ml: "നമസ്കാരം! ഞാൻ സാഥി, നിങ്ങളുടെ വ്യക്തിഗത സേവന കോർഡിനേറ്റർ. ഇന്ന് ഞാൻ നിങ്ങൾക്ക് എന്താണ് ചെയ്തു നൽകേണ്ടത്?",
      bn: "নমস্কার! আমি সাথী, আপনার ব্যক্তিগত পরিষেবা সমন্বয়কারী। আজ আমি আপনার জন্য কী করতে পারি?",
      mr: "नमस्कार! मी साथी आहे, तुमची वैयक्तिक सेवा समन्वयक. आज मी तुमच्यासाठी काय करू शकते?",
      gu: "નમસ્તે! હું સાથી છું, તમારી વ્યક્તિગત સેવા સંયોજક. આજે હું તમારા માટે શું કરી શકું?",
      es: "¡Hola! Soy Sathi, tu coordinadora de servicios por voz. ¿En qué te puedo ayudar hoy?",
      fr: "Bonjour! Je suis Sathi, votre coordinatrice de services vocaux. Que puis-je faire pour vous aujourd'hui?",
      de: "Hallo! Ich bin Sathi, Ihre persönliche Sprachservice-Koordinatorin. Was kann ich heute für Sie erledigen?",
      other: "Hello! I'm Sathi, your personal voice service coordinator. What can I take care of for you today?",
    },
  };

  const entry = dictionary[key];
  if (!entry) return '';
  let str = entry[lang] || entry.en;

  for (const [k, v] of Object.entries(params)) {
    str = str.replace(new RegExp(`{${k}}`, 'g'), String(v));
  }
  return str;
}

export interface SathiSessionContext {
  sessionId: string;
  userId: string;
  messages: AgentMessage[];
  pendingTaskPlan?: Partial<Task>;
  pendingFlow?: PendingConversationFlow;
  activeTaskId?: string;
  selectedExecutorCandidate?: DispatchCandidate;
  misunderstandingCount?: number;
  lastTopic?: string;
  lastLocation?: string;
  lastTime?: string;
  cachedPlaces?: PlaceResult[];
  preferredLanguage?: SupportedLanguage;
  detectedLanguageName?: string;
}

/**
 * Generates natural, progressive contextual recovery responses when user input is unclear
 */
export function getContextualRecoveryResponse(
  session: SathiSessionContext,
  input: string,
  lang: SupportedLanguage
): string {
  session.misunderstandingCount = (session.misunderstandingCount || 0) + 1;
  const count = session.misunderstandingCount;
  const lower = input.toLowerCase();

  const hasHospitalRef = lower.includes('hospital') || lower.includes('aaspattri') || session.lastTopic === 'hospital';
  const hasMedRef = lower.includes('medicine') || lower.includes('pharmacy') || lower.includes('mandulu') || lower.includes('dawa') || session.lastTopic === 'medicine';
  const hasTimeRef = session.lastTime || (lower.includes('pm') || lower.includes('am') || lower.includes('today') || lower.includes('tomorrow'));

  if (lang === 'te') {
    if (hasHospitalRef) {
      return "మీరు ఆసుపత్రి లేదా డాక్టర్ సందర్శన గురించి మాట్లాడుతున్నారని గమనించాను. మీరు ఏ ఆసుపత్రికి వెళ్ళాలి లేదా సహాయకుడిని ఏ సమయానికి బుక్ చేయమంటారు?";
    }
    if (hasMedRef) {
      return "మీకు మందుల సేకరణ సహాయం కావాలా? ఏ ఫార్మసీ నుండి మందులు తెప్పించాలో లేదా మీ చిరునామా ఏమిటో చెప్పండి.";
    }
    if (count === 1) {
      return "నన్ను క్షమించండి, నాకు స్పష్టంగా అర్థం కాలేదు. మీకు మందుల డెలివరీ కావాలా, ఆసుపత్రి సహాయం కావాలా, లేదా వాహనం కావాలా? దయచేసి వివరంగా చెప్పండి.";
    }
    if (count === 2) {
      return "మరొక్కసారి చెప్పగలరా? మీకు కావలసిన సేవను స్పష్టంగా చెప్పండి (ఉదాహరణకు: 'నాకు ప్రభుత్వ ఆసుపత్రికి వెళ్ళాలి' లేదా 'అపోలో నుండి మందులు తేవాలి').";
    }
    return "మనం సులభంగా పూర్తి చేద్దాం. మీరు వెళ్ళాలనుకుంటున్న స్థలం లేదా మీకు కావలసిన పని ఏమిటో వివరంగా చెప్పండి, నేను వెంటనే సమీప సహాయకుడిని ఏర్పాటు చేస్తాను.";
  }

  if (lang === 'hi') {
    if (hasHospitalRef) {
      return "मुझे लगा कि आप अस्पताल या डॉक्टर के पास जाने के बारे में कह रहे हैं। क्या आप बता सकते हैं कि आपको किस अस्पताल जाना है और किस समय?";
    }
    if (hasMedRef) {
      return "क्या आपको फार्मेसी से दवाई मंगवानी है? कृपया मेडिकल स्टोर का नाम या अपना पता बताएं।";
    }
    if (count === 1) {
      return "माफ़ कीजिए, मैं ठीक से समझ नहीं पाई। क्या आपको दवाई मंगवानी है, अस्पताल जाना है, या सवारी चाहिए? कृपया थोड़ा विस्तार से बताएं।";
    }
    if (count === 2) {
      return "कृपया एक बार फिर से बताएं कि आपको क्या सहायता चाहिए (जैसे: 'मुझे डॉक्टर के पास जाना है' या 'अस्पताल के लिए गाड़ी चाहिए')।";
    }
    return "आइए इसे आसान बनाते हैं। आप बस उस जगह या काम का नाम बताएं जिसमें आपको सहायता चाहिए, मैं तुरंत व्यवस्था कर दूँगी।";
  }

  // English default
  if (hasHospitalRef) {
    return "I noticed you mentioned a medical or hospital need. Could you tell me which hospital or clinic you'd like to visit, or what time you need assistance?";
  }
  if (hasMedRef) {
    return "Would you like our executor to pick up medicines for you? Please let me know the pharmacy name or your delivery address.";
  }
  if (hasTimeRef && session.lastTime) {
    return `I noted your preferred time around ${session.lastTime}. What service would you like me to coordinate for you at that time?`;
  }
  if (count === 1) {
    return "I didn't quite catch the specific destination or task details. Could you tell me if you'd like a ride, a medicine delivery, grocery help, or hospital accompaniment?";
  }
  if (count === 2) {
    return "I want to make sure I get everything right for you. Could you please rephrase what you need help with (for example, 'Pick up medicines from Apollo' or 'Book a ride to Government Hospital')?";
  }
  return "Let's take it step by step. Just tell me what destination or chore you have in mind, and I will match a verified local assistant to help you.";
}

export class SathiAgent {
  sessions: Map<string, SathiSessionContext> = new Map();

  getOrCreateSession(sessionId: string, userId: string): SathiSessionContext {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        sessionId,
        userId,
        messages: [
          {
            id: `msg_${Date.now()}`,
            sender: 'sathi',
            text: "Hello! I'm Sathi, your personal service coordinator. What can I take care of for you today?",
            timestamp: new Date().toISOString(),
          },
        ],
      };
      this.sessions.set(sessionId, session);
    }
    return session;
  }

  /**
   * Process user utterance (text or transcribed voice)
   */
  async processUserMessage(
    sessionId: string,
    userId: string,
    userInput: string,
    isVoice: boolean = false
  ): Promise<AgentMessage> {
    const session = this.getOrCreateSession(sessionId, userId);
    const user = db.users.get(userId);
    const userLocation = user?.location || {
      latitude: 12.9716,
      longitude: 77.6412,
      address: 'Indiranagar, Bengaluru',
      city: 'Bengaluru',
    };

    // Record user message
    const userMsg: AgentMessage = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      text: userInput,
      timestamp: new Date().toISOString(),
      voiceTranscript: isVoice,
    };
    session.messages.push(userMsg);

    // Retrieve user memories for context
    const userMemories = db.memories.get(userId) || [];
    const memoryContext = userMemories.map((m) => `${m.key}: ${m.value}`).join('; ');

    // Normalize prompt by stripping wake word if present
    const cleanedInput = userInput.replace(/^(hey|hi|hello)?\s*sathi[,\s]*/i, '').trim();
    const lower = cleanedInput.toLowerCase();

    // Auto-detect input language (English, Telugu, Hindi, etc.) and persist preferred language
    const detectedLang = detectLanguage(userInput);
    const langName = detectedLang === 'te' ? 'Telugu' : detectedLang === 'hi' ? 'Hindi' : 'English';

    session.preferredLanguage = detectedLang;
    session.detectedLanguageName = langName;

    if (user) {
      user.preferredLanguage = detectedLang;
    }

    const isTelugu = detectedLang === 'te';
    const isHindi = detectedLang === 'hi';

    const toolCalls: AgentToolCall[] = [];
    let responseText = '';
    let structuredData: AgentMessage['structuredData'] = {};

    // 0. Check if an active multi-turn discovery flow is ongoing (Section 4 & 5)
    if (session.pendingFlow) {
      const flow = session.pendingFlow;

      if (flow.type === 'HOME_OR_TRAVEL') {
        if (flow.step === 'TRANSPORT_PREF') {
          flow.data.transportPreference = cleanedInput;
          flow.step = 'PICKUP';
          responseText = isTelugu
            ? "సరే. నేను మిమ్మల్ని ఎక్కడి నుండి పికప్ చేసుకోవాలి?"
            : "Okay. Where should I pick you up from?";
        } else if (flow.step === 'PICKUP') {
          flow.data.pickupLocation = cleanedInput;
          flow.step = 'DESTINATION';
          responseText = isTelugu
            ? "అర్థమైంది. మీ గమ్యస్థానం ఏమిటి?"
            : "Got it. And what is your destination?";
        } else if (flow.step === 'DESTINATION') {
          flow.data.destination = cleanedInput;
          flow.step = 'TIME';
          responseText = isTelugu
            ? "ఖచ్చితంగా. మీరు ఏ సమయానికి బయలుదేరాలనుకుంటున్నారు?"
            : "Sure. What time would you like to leave?";
        } else if (flow.step === 'TIME') {
          flow.data.time = cleanedInput;

          const transport = flow.data.transportPreference || 'taxi';
          const pickup = flow.data.pickupLocation || 'St. Ann\'s College';
          const dest = flow.data.destination || 'My home in Chirala';
          const time = flow.data.time || 'Today, 6:00 PM';

          session.pendingFlow = undefined;

          const pickupLoc = {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            address: pickup,
            city: userLocation.city || 'Bengaluru',
          };
          const destLoc = {
            latitude: userLocation.latitude + 0.02,
            longitude: userLocation.longitude + 0.02,
            address: dest,
            city: userLocation.city || 'Bengaluru',
          };

          const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
          const newTask: Task = {
            id: taskId,
            userId,
            userName: user?.name || 'User',
            userPhone: user?.phone || '+91 98765 43210',
            serviceType: 'TRANSPORTATION',
            title: `Assisted Ride (${transport}) to ${dest}`,
            description: `Transportation from ${pickup} to ${dest} via ${transport} scheduled at ${time}`,
            pickupLocation: pickupLoc,
            destinationLocation: destLoc,
            scheduledAt: time,
            preferredLanguage: detectedLang,
            metadata: {
              detectedLanguage: detectedLang,
              languageName: langName,
              inputChannel: isVoice ? 'voice' : 'text',
              detectedAt: new Date().toISOString(),
            },
            requirements: {
              itemsList: [`Transport preference: ${transport}`, `Destination: ${dest}`],
              urgency: 'NORMAL',
              preferredLanguage: detectedLang,
              detectedLanguage: langName,
            },
            estimatedCost: 150,
            status: 'WAITING_FOR_USER_CONFIRMATION',
            paymentStatus: 'PAYMENT_PENDING',
            verificationStatus: 'PENDING',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          db.tasks.set(newTask.id, newTask);
          session.activeTaskId = newTask.id;

          const candidates = dispatchEngine.rankCandidates('TRANSPORTATION', newTask.pickupLocation, new Set<string>());

          toolCalls.push({
            toolName: 'create_task',
            arguments: { serviceType: 'TRANSPORTATION', title: newTask.title, pickupLocation: pickupLoc },
            authorized: true,
            result: { taskId: newTask.id, status: newTask.status },
            latencyMs: 14,
          });

          responseText = isTelugu
            ? `అర్థమైంది. మీకు ${pickup} నుండి ${dest} కి ${time} సమయానికి ${transport} సదుపాయం కావాలి. నేను అందుబాటులో ఉన్న ఎగ్జిక్యూటర్‌ను వెతకమంటారా?`
            : `Got it. You need a ${transport} from ${pickup} to ${dest} at ${time}. Shall I find an available executor for you?`;

          structuredData = {
            intent: 'SERVICE_REQUEST',
            entities: { serviceType: 'TRANSPORTATION', transportPreference: transport, pickup, destination: dest, scheduledAt: time },
            taskPlan: newTask,
            suggestedExecutors: candidates.slice(0, 3),
            requiresConfirmation: true,
            confirmationType: 'TASK_CREATE',
            toolCalls,
          };
        }

        const agentMsg: AgentMessage = {
          id: `msg_s_${Date.now()}`,
          sender: 'sathi',
          text: responseText,
          timestamp: new Date().toISOString(),
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          structuredData,
        };
        session.messages.push(agentMsg);
        return agentMsg;
      }

      if (flow.type === 'HOSPITAL_VISIT') {
        if (flow.step === 'TIME') {
          flow.data.time = cleanedInput;
          flow.step = 'PICKUP';
          responseText = isTelugu
            ? "సరే. నేను మిమ్మల్ని ఎక్కడి నుండి పికప్ చేసుకోవాలి? దయచేసి మీ పికప్ చిరునామా చెప్పండి."
            : "Where should I pick you up from? Please let me know your home address or current pickup spot.";
        } else if (flow.step === 'PICKUP') {
          flow.data.pickupLocation = cleanedInput;
          flow.step = 'DESTINATION';
          responseText = isTelugu
            ? "మీరు ఏ ఆసుపత్రికి వెళ్ళాలనుకుంటున్నారు? ప్రభుత్వ ఆసుపత్రి లేదా ప్రైవేట్ క్లినిక్?"
            : "Which hospital or clinic would you like to go to? We can assist you at Government Hospital, local clinics, or specialty centers.";
        } else if (flow.step === 'DESTINATION') {
          flow.data.destination = cleanedInput;
          flow.step = 'DURATION';
          responseText = isTelugu
            ? "ఎగ్జిక్యూటర్ సహాయం మీకు ఎంత సమయం అవసరం అవుతుంది? ఉదాహరణకు రెండు గంటలు లేదా డాక్టర్ కన్సల్టేషన్ పూర్తయ్యే వరకు?"
            : "Approximately how long will you need the executor's assistance at the hospital? For example, about two hours or through your appointment?";
        } else if (flow.step === 'DURATION') {
          flow.data.duration = cleanedInput;

          const time = flow.data.time || 'Today, 4:00 PM';
          const pickup = flow.data.pickupLocation || userLocation.address || 'User Residence';
          const hospital = flow.data.destination || 'Government Hospital Chirala';
          const duration = flow.data.duration || 'About 2 hours';

          session.pendingFlow = undefined;

          const pickupLoc = {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            address: pickup,
            city: userLocation.city || 'Bengaluru',
          };
          const destLoc = {
            latitude: userLocation.latitude + 0.015,
            longitude: userLocation.longitude + 0.015,
            address: hospital,
            city: userLocation.city || 'Bengaluru',
          };

          const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
          const newTask: Task = {
            id: taskId,
            userId,
            userName: user?.name || 'User',
            userPhone: user?.phone || '+91 98765 43210',
            serviceType: 'TRANSPORTATION',
            title: `Hospital Assistance: ${hospital}`,
            description: `Escort and assistance to ${hospital} from ${pickup} scheduled at ${time}, duration ${duration}`,
            pickupLocation: pickupLoc,
            destinationLocation: destLoc,
            scheduledAt: time,
            preferredLanguage: detectedLang,
            metadata: {
              detectedLanguage: detectedLang,
              languageName: langName,
              inputChannel: isVoice ? 'voice' : 'text',
              detectedAt: new Date().toISOString(),
            },
            requirements: {
              itemsList: [`Assistance duration: ${duration}`, `Destination: ${hospital}`],
              urgency: 'HIGH',
              preferredLanguage: detectedLang,
              detectedLanguage: langName,
            },
            estimatedCost: 200,
            status: 'WAITING_FOR_USER_CONFIRMATION',
            paymentStatus: 'PAYMENT_PENDING',
            verificationStatus: 'PENDING',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          db.tasks.set(newTask.id, newTask);
          session.activeTaskId = newTask.id;

          const candidates = dispatchEngine.rankCandidates('TRANSPORTATION', newTask.pickupLocation, new Set<string>());

          toolCalls.push({
            toolName: 'create_task',
            arguments: { serviceType: 'TRANSPORTATION', title: newTask.title, pickupLocation: pickupLoc },
            authorized: true,
            result: { taskId: newTask.id, status: newTask.status },
            latencyMs: 14,
          });

          responseText = isTelugu
            ? `అర్థమైంది. మీకు ${pickup} నుండి ${hospital} కి ${time} సమయానికి, దాదాపు ${duration} సేవల కోసం సహాయం కావాలి. నేను అందుబాటులో ఉన్న ఎగ్జిక్యూటర్‌ను వెతకమంటారా?`
            : `Understood. I have planned companion assistance from ${pickup} to ${hospital} at ${time}, with approximately ${duration} of assistance. Verified providers are active in this sector. Would you like me to find an available executor?`;

          structuredData = {
            intent: 'SERVICE_REQUEST',
            entities: { serviceType: 'TRANSPORTATION', pickup, hospital, duration, scheduledAt: time },
            taskPlan: newTask,
            suggestedExecutors: candidates.slice(0, 3),
            requiresConfirmation: true,
            confirmationType: 'TASK_CREATE',
            toolCalls,
          };
        }

        const agentMsg: AgentMessage = {
          id: `msg_s_${Date.now()}`,
          sender: 'sathi',
          text: responseText,
          timestamp: new Date().toISOString(),
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          structuredData,
        };
        session.messages.push(agentMsg);
        return agentMsg;
      }
    }

    // Check for trigger phrases that initiate progressive multi-turn questioning (Section 4 & 5)
    const isNeedToGoHome = (lower.includes('go home') || lower.includes('reach home') || lower.includes('intiki vellali') || lower.includes('ghar jaana')) &&
      !lower.includes('from') && !lower.includes('pickup');

    if (isNeedToGoHome) {
      session.pendingFlow = {
        type: 'HOME_OR_TRAVEL',
        step: 'TRANSPORT_PREF',
        data: { destination: 'Home' },
        language: isTelugu ? 'te' : 'en',
      };
      responseText = isTelugu
        ? "ఖచ్చితంగా. నేను సహాయం చేయగలను. మీకు బైక్ కావాలా లేదా టాక్సీ కావాలా?"
        : "Sure. I can help you arrange that. Would you prefer a bike or a taxi?";

      const agentMsg: AgentMessage = {
        id: `msg_s_${Date.now()}`,
        sender: 'sathi',
        text: responseText,
        timestamp: new Date().toISOString(),
      };
      session.messages.push(agentMsg);
      return agentMsg;
    }

    const isHospitalVisit =
      (lower.includes('hospital') ||
       lower.includes('aaspattri') ||
       (lower.includes('clinic') && !lower.includes('city care')) ||
       lower.includes('doctor visit') ||
       lower.includes('see a doctor')) &&
      !lower.includes('pick me up from') &&
      !lower.includes('at 4 pm') &&
      !lower.includes('about two hours') &&
      !lower.includes('government hospital chirala');

    if (isHospitalVisit) {
      session.pendingFlow = {
        type: 'HOSPITAL_VISIT',
        step: 'TIME',
        data: {},
        language: isTelugu ? 'te' : 'en',
      };
      responseText = isTelugu
        ? "ఖచ్చితంగా. మీ ఆసుపత్రి సందర్శనకు తోడుగా ఉండేందుకు సహాయకుడిని ఏర్పాటు చేయగలను. మీరు ఏ సమయానికి వెళ్ళాలనుకుంటున్నారు?"
        : "I can certainly arrange companion assistance and transportation for your hospital visit. When would you like to go, or what time is your appointment?";

      const agentMsg: AgentMessage = {
        id: `msg_s_${Date.now()}`,
        sender: 'sathi',
        text: responseText,
        timestamp: new Date().toISOString(),
      };
      session.messages.push(agentMsg);
      return agentMsg;
    }

    // 1. Intent Understanding & Entity Extraction
    const nlpResult = await this.understandIntent(cleanedInput, session, memoryContext);

    // Check if user is supplying location/details for an existing unconfirmed task
    const activeWaitingTask = session.activeTaskId ? db.tasks.get(session.activeTaskId) : null;
    const isConfirmPhrase = /^(yes|confirm|proceed|ok|okay|do it|dispatch|sure|go ahead|avunu|sare|theek hai|haan|book it|book|yes confirm|please confirm|confirm dispatch)/i.test(cleanedInput);
    const isCancelPhrase = /^(cancel|no|stop|don't|dont|vద్దు)/i.test(cleanedInput);

    if (activeWaitingTask && activeWaitingTask.status === 'WAITING_FOR_USER_CONFIRMATION' && !isConfirmPhrase && !isCancelPhrase) {
      const extractedPlace = nlpResult.entities.destination || nlpResult.entities.pharmacy || nlpResult.entities.query || nlpResult.entities.items;
      const newPlace = extractedPlace || (cleanedInput.length > 2 && !cleanedInput.includes('?') ? cleanedInput : null);

      if (newPlace) {
        const cleanPlace = newPlace.replace(/^(go to|visit|take me to|i want to go to|at|to)\s+/i, '').trim();
        const baseTitle = activeWaitingTask.serviceType === 'GROCERY_ASSISTANCE' || activeWaitingTask.title.includes('Shopping')
          ? 'Shopping Assistance'
          : activeWaitingTask.title.split(':')[0];
        activeWaitingTask.title = `${baseTitle}: ${cleanPlace}`;
        activeWaitingTask.destinationLocation = {
          ...userLocation,
          address: cleanPlace.includes('Chirala') ? cleanPlace : `${cleanPlace}, Chirala`,
        };
        activeWaitingTask.preferredLanguage = detectedLang;
        activeWaitingTask.requirements = {
          ...activeWaitingTask.requirements,
          preferredLanguage: detectedLang,
          detectedLanguage: langName,
        };
        activeWaitingTask.metadata = {
          ...(activeWaitingTask.metadata || {}),
          detectedLanguage: detectedLang,
          languageName: langName,
          updatedAt: new Date().toISOString(),
        };
        db.tasks.set(activeWaitingTask.id, activeWaitingTask);

        responseText = isTelugu
          ? `అర్థమైంది! నేను మీ అభ్యర్థనను ${cleanPlace} కి అప్‌డేట్ చేశాను. అంచనా రుసుము ₹${activeWaitingTask.estimatedCost}. సమీపంలో ఉన్న ఎగ్జిక్యూటర్‌ను పంపమంటారా?`
          : `Got it! I have updated your request for ${cleanPlace}. The estimated fee is ₹${activeWaitingTask.estimatedCost}. Would you like me to confirm and dispatch our nearest verified provider?`;

        structuredData = {
          intent: 'SERVICE_REQUEST',
          entities: { ...nlpResult.entities, destination: cleanPlace },
          taskPlan: activeWaitingTask,
          suggestedExecutors: dispatchEngine.rankCandidates(activeWaitingTask.serviceType, activeWaitingTask.pickupLocation, new Set<string>()).slice(0, 3),
          requiresConfirmation: true,
          confirmationType: 'TASK_CREATE',
        };

        const agentMsg: AgentMessage = {
          id: `msg_s_${Date.now()}`,
          sender: 'sathi',
          text: responseText,
          timestamp: new Date().toISOString(),
          structuredData,
        };
        session.messages.push(agentMsg);
        return agentMsg;
      }
    }

    switch (nlpResult.intent) {
      case 'SERVICE_REQUEST': {
        const { serviceType, pharmacy, items, scheduledAt, destination } = nlpResult.entities;

        // Check for missing critical info
        if (!serviceType) {
          responseText = nlpResult.conversationalReply || "I'd be glad to help. Could you tell me what kind of service you need? For example, medicine pickup, grocery assistance, or transportation?";
          break;
        }

        if (serviceType === 'MEDICINE_PICKUP' && !pharmacy) {
          // Check memory
          const preferredPharm = userMemories.find((m) => m.key === 'preferred_pharmacy');
          if (preferredPharm) {
            responseText = nlpResult.conversationalReply || `Sure, I can arrange that. Should I pick it up from your usual pharmacy (${preferredPharm.value}), or a different one?`;
            session.pendingTaskPlan = {
              serviceType: 'MEDICINE_PICKUP',
              pickupLocation: {
                latitude: 12.972,
                longitude: 77.643,
                address: preferredPharm.value,
                city: 'Bengaluru',
              },
            };
          } else {
            responseText = nlpResult.conversationalReply || "Sure! Which pharmacy would you like me to pick up the medicines from?";
            session.pendingTaskPlan = { serviceType: 'MEDICINE_PICKUP' };
          }
          break;
        }

        if (serviceType === 'TRANSPORTATION' && !destination && !nlpResult.entities.pickup) {
          responseText = nlpResult.conversationalReply || (isTelugu
            ? "సరే! నేను రవాణా సౌకర్యాన్ని ఏర్పాటు చేయగలను. మీరు ఎక్కడి నుండి బయలుదేరాలి మరియు మీ గమ్యస్థానం ఏమిటి?"
            : "Sure! I can arrange transportation for you. Where should we pick you up from and what is your destination?");
          break;
        }

        // Build Task Plan
        const pickupLoc = pharmacy
          ? {
              latitude: 12.973,
              longitude: 77.645,
              address: pharmacy.includes('Bengaluru') ? pharmacy : `${pharmacy}, Indiranagar, Bengaluru`,
              city: 'Bengaluru',
            }
          : userLocation;

        const isShoppingRequest =
          lower.includes('shopping') ||
          lower.includes('market') ||
          lower.includes('bazaar') ||
          Boolean(items && items.toLowerCase().includes('shopping'));

        const taskTitle =
          isShoppingRequest
            ? `Shopping Trip & Market Assistance: ${destination || 'Chirala Main Market'}`
            : serviceType === 'MEDICINE_PICKUP'
            ? `Medicine Pickup from ${pharmacy || 'Pharmacy'}`
            : serviceType === 'GROCERY_ASSISTANCE'
            ? 'Grocery Assistance'
            : serviceType === 'TRANSPORTATION'
            ? 'Transportation Assistance'
            : 'Personal Care / Companion Service';

        const estimatedCost = isShoppingRequest ? 90 : serviceType === 'MEDICINE_PICKUP' ? 80 : 120;

        // Create Task in DRAFT or PLANNED state via backend tool
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
        const newTask: Task = {
          id: taskId,
          userId,
          userName: user?.name || 'User',
          userPhone: user?.phone || '+91 98765 43210',
          serviceType: serviceType as ServiceType,
          title: taskTitle,
          description: items || (isShoppingRequest ? 'Shopping assistance and market accompaniment' : `Pickup and delivery coordinated by Sathi for ${user?.name}`),
          pickupLocation: pickupLoc,
          destinationLocation: destination
            ? { ...userLocation, address: destination.includes('Market') ? destination : `${destination}, Chirala` }
            : userLocation,
          scheduledAt: scheduledAt || 'Today, 4:00 PM',
          preferredLanguage: detectedLang,
          metadata: {
            detectedLanguage: detectedLang,
            languageName: langName,
            inputChannel: isVoice ? 'voice' : 'text',
            detectedAt: new Date().toISOString(),
          },
          requirements: {
            itemsList: items ? [items] : ['Shopping assistance & accompaniment'],
            urgency: 'NORMAL',
            preferredLanguage: detectedLang,
            detectedLanguage: langName,
          },
          estimatedCost,
          status: 'WAITING_FOR_USER_CONFIRMATION',
          paymentStatus: 'PAYMENT_PENDING',
          verificationStatus: 'PENDING',
          verificationCode: Math.floor(1000 + Math.random() * 9000).toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        db.tasks.set(newTask.id, newTask);
        session.activeTaskId = newTask.id;

        // Find candidate executors deterministically
        const candidates = dispatchEngine.rankCandidates(
          newTask.serviceType,
          newTask.pickupLocation,
          new Set<string>()
        );

        toolCalls.push({
          toolName: 'create_task',
          arguments: { serviceType, title: taskTitle, pickupLocation: pickupLoc },
          authorized: true,
          result: { taskId: newTask.id, status: newTask.status },
          latencyMs: 12,
        });

        toolCalls.push({
          toolName: 'search_executors',
          arguments: { serviceType, location: pickupLoc },
          authorized: true,
          result: { count: candidates.length, topCandidate: candidates[0]?.executorName },
          latencyMs: 8,
        });

        structuredData = {
          intent: 'SERVICE_REQUEST',
          entities: nlpResult.entities,
          taskPlan: newTask,
          suggestedExecutors: candidates.slice(0, 3),
          requiresConfirmation: true,
          confirmationType: 'TASK_CREATE',
          toolCalls,
        };

        if (candidates.length > 0) {
          const place = destination || pharmacy || items;
          if (place) {
            responseText = isTelugu
              ? `అర్థమైంది! నేను ${place} కోసం మీ సేవా అభ్యర్థనను సిద్ధం చేశాను. అంచనా రుసుము ₹${estimatedCost}. సమీపంలో ఉన్న ఎగ్జిక్యూటర్‌ను పంపమంటారా?`
              : `Got it! I have prepared your request for ${taskTitle}. The estimated fee is ₹${estimatedCost}. Would you like me to confirm and dispatch our nearest verified provider?`;
          } else if (nlpResult.conversationalReply && !nlpResult.conversationalReply.includes('Which specific market')) {
            responseText = nlpResult.conversationalReply;
          } else if (isShoppingRequest) {
            responseText = isTelugu
              ? "నేను షాపింగ్ సహాయం కోసం సేవను సిద్ధం చేశాను. మీరు ఏ మార్కెట్ లేదా స్టోర్‌కు వెళ్లాలనుకుంటున్నారు?"
              : "I can arrange a verified local assistant to accompany you and help with shopping! Which market or store would you like to visit?";
          } else {
            responseText = `I have prepared your service plan for ${taskTitle}. We have verified regional providers available nearby in your service area. The estimated fee is ₹${estimatedCost}. Would you like me to confirm and dispatch this request?`;
          }
        } else {
          responseText = `I've prepared your request, but there are no verified providers currently available in your radius. Would you like me to try another time?`;
        }
        break;
      }

      case 'CONFIRM_DISPATCH': {
        const activeTaskId = session.activeTaskId;
        const task = activeTaskId ? db.tasks.get(activeTaskId) : null;

        if (!task) {
          responseText = "I don't have an active request waiting for confirmation. What service would you like to set up?";
          break;
        }

        task.status = 'CONFIRMED';
        if (!task.verificationCode) {
          task.verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
        }
        db.tasks.set(task.id, task);

        const dispatchResult = dispatchEngine.startDispatch(task.id);

        toolCalls.push({
          toolName: 'start_dispatch',
          arguments: { taskId: task.id },
          authorized: true,
          result: dispatchResult,
          latencyMs: 15,
        });

        if (dispatchResult.success && dispatchResult.attempt) {
          responseText = isTelugu
            ? `ధృవీకరించబడింది! మీ సేవా అభ్యర్థన విజయవంతంగా సెట్ చేయబడింది. మీ 4-అంకెల సేవా ధృవీకరణ కోడ్: ${task.verificationCode}. సేవ పూర్తయిన తర్వాత ఎగ్జిక్యూటర్‌కు ఈ కోడ్‌ని చెప్పండి.`
            : `Confirmed! Your service request has been dispatched to our verified regional providers nearby. Your 4-digit service verification code is ${task.verificationCode}. Please share this code with your provider once the task is completed.`;

          // Autonomous agentic workflow: contacted regional provider reviews and accepts the offer
          const attemptId = dispatchResult.attempt.id;
          const execId = dispatchResult.attempt.currentExecutorId;
          if (attemptId && execId) {
            setTimeout(() => {
              const currentAttempt = db.dispatchAttempts.get(attemptId);
              if (currentAttempt && currentAttempt.status === 'OFFER_SENT' && currentAttempt.currentExecutorId === execId) {
                dispatchEngine.handleExecutorResponse(attemptId, execId, 'ACCEPT');
                console.info(`[Autonomous Agent] Executor ${execId} accepted task ${task.id}`);
              }
            }, 4000);
          }
        } else {
          responseText = "I couldn't find an available verified service provider for that request right now. Would you like me to try a different time?";
        }

        structuredData = {
          intent: 'CONFIRM_DISPATCH',
          taskPlan: task,
          toolCalls,
        };
        break;
      }

      case 'CANCEL_REASSIGN': {
        const activeTaskId = session.activeTaskId;
        const task = activeTaskId ? db.tasks.get(activeTaskId) : null;

        if (!task || !task.assignedExecutorId) {
          responseText = "You don't have an active assigned provider right now.";
          break;
        }

        const prevName = task.assignedExecutorName || 'the assigned provider';
        const reassignResult = dispatchEngine.cancelExecutorAndReassign(
          task.id,
          'User requested different provider'
        );

        toolCalls.push({
          toolName: 'release_executor',
          arguments: { taskId: task.id, reason: 'User requested alternative' },
          authorized: true,
          result: reassignResult,
          latencyMs: 14,
        });

        if (reassignResult.success && reassignResult.nextAttempt) {
          responseText = `Understood. I have released the previous assignment and dispatched the request to the next available verified regional provider. You will be notified the moment they confirm acceptance.`;
        } else {
          responseText = `I have cancelled ${prevName}, but no other verified providers are currently available nearby. Would you like me to retry later?`;
        }

        structuredData = {
          intent: 'CANCEL_REASSIGN',
          taskPlan: task,
          toolCalls,
        };
        break;
      }

      case 'APPOINTMENT_REQUEST': {
        const { title, doctor, location, time } = nlpResult.entities;

        if (!doctor && !location && (!title || title === 'Medical Appointment' || title === 'Doctor Appointment')) {
          responseText = "I'd be glad to help schedule an appointment or arrange an accompaniment. Which doctor, clinic, or hospital would you like to visit, and what date or time do you prefer?";
          structuredData = {
            intent: 'APPOINTMENT_REQUEST',
            entities: nlpResult.entities,
          };
          break;
        }

        const apptId = `apt_${Date.now()}`;
        const newAppt = {
          id: apptId,
          userId,
          title: title || (doctor ? `Appointment with ${doctor}` : 'Doctor Appointment'),
          doctorOrService: doctor || 'Consultant Doctor',
          location: location || 'Regional Medical Clinic',
          scheduledTime: time || new Date(Date.now() + 24 * 3600000).toISOString(),
          reminderMinutesBefore: 60,
          transportationRequested: false,
          status: 'SCHEDULED' as const,
          createdAt: new Date().toISOString(),
        };
        db.appointments.set(apptId, newAppt);

        toolCalls.push({
          toolName: 'create_appointment',
          arguments: newAppt,
          authorized: true,
          result: { id: apptId },
          latencyMs: 10,
        });

        responseText = `Done. I've saved your appointment for ${newAppt.title} at ${newAppt.location}. I will remind you one hour before. Would you like me to arrange transportation as well?`;
        structuredData = {
          intent: 'APPOINTMENT_REQUEST',
          entities: nlpResult.entities,
          toolCalls,
        };
        break;
      }

      case 'REMINDER_REQUEST': {
        const { title, time, category } = nlpResult.entities;
        const remId = `rem_${Date.now()}`;
        const newRem = {
          id: remId,
          userId,
          title: title || 'Medication Reminder',
          dueTime: time || new Date(Date.now() + 3600000).toISOString(),
          category: (category as any) || 'MEDICINE',
          isRecurring: false,
          completed: false,
          createdAt: new Date().toISOString(),
        };
        db.reminders.set(remId, newRem);

        toolCalls.push({
          toolName: 'create_reminder',
          arguments: newRem,
          authorized: true,
          result: { id: remId },
          latencyMs: 9,
        });

        responseText = `Got it. I have set a reminder: "${newRem.title}". I'll make sure to alert you right on time.`;
        structuredData = {
          intent: 'REMINDER_REQUEST',
          entities: nlpResult.entities,
          toolCalls,
        };
        break;
      }

      case 'FEEDBACK': {
        const lastCompletedTask = Array.from(db.tasks.values())
          .filter((t) => t.userId === userId && t.status === 'COMPLETED')
          .pop();

        session.misunderstandingCount = 0;

        if (lastCompletedTask && !lastCompletedTask.rating) {
          const taskRating = nlpResult.entities.rating || 5;
          lastCompletedTask.rating = taskRating;
          lastCompletedTask.feedback = nlpResult.entities.feedbackText || cleanedInput;
          db.tasks.set(lastCompletedTask.id, lastCompletedTask);

          if (lastCompletedTask.assignedExecutorId) {
            const executor = db.executors.get(lastCompletedTask.assignedExecutorId);
            if (executor) {
              executor.totalRatingsCount = (executor.totalRatingsCount || 0) + 1;
              executor.rating =
                Math.round(
                  ((executor.rating * (executor.totalRatingsCount - 1) + taskRating) /
                    executor.totalRatingsCount) *
                    10
                ) / 10;
              db.executors.set(executor.id, executor);
            }
          }

          db.addAuditEvent({
            actor: 'USER',
            actorId: userId,
            action: 'TASK_FEEDBACK_RECORDED',
            resourceType: 'TASK',
            resourceId: lastCompletedTask.id,
            metadata: { rating: lastCompletedTask.rating, feedback: lastCompletedTask.feedback },
            result: 'SUCCESS',
          });
        }

        responseText = isTelugu
          ? 'మీ అభిప్రాయానికి ధన్యవాదాలు! మీ సంతృప్తి మా ప్రాధాన్యత. నేను మీకు మరింకేదైనా సహాయం చేయగలనా?'
          : 'Thank you for your valuable feedback! I have recorded it for your executor. Is there anything else I can coordinate for you today?';
        break;
      }

      case 'PLACES_SEARCH': {
        session.misunderstandingCount = 0;
        const queryText = nlpResult.entities.query || cleanedInput;
        const category = nlpResult.entities.category;

        const placesStartTime = Date.now();
        const searchResults = await placesService.searchPlaces(queryText, userLocation, category);
        const latencyMs = Date.now() - placesStartTime;

        session.cachedPlaces = searchResults;

        toolCalls.push({
          toolName: 'search_places',
          arguments: { query: queryText, category, userLocation: `${userLocation.latitude},${userLocation.longitude}` },
          authorized: true,
          result: { count: searchResults.length, places: searchResults.slice(0, 4) },
          latencyMs,
        });

        if (searchResults.length === 0) {
          responseText = isTelugu
            ? `నన్ను క్షమించండి, ఆ ప్రదేశం కోసం నాకు ఫలితాలు దొరకలేదు. మీరు సమీపంలోని ఆసుపత్రి లేదా ఫార్మసీ పేరును మరొకసారి చెప్పగలరా?`
            : `I couldn't find exact matches for "${queryText}". Could you please name a nearby landmark, hospital, or pharmacy in your town?`;
        } else {
          const topPlaces = searchResults.slice(0, 3);
          const topNames = topPlaces.map((p) => `${p.name} (${p.rating ? p.rating + '★' : 'Verified'}, ${p.distanceKm ? p.distanceKm + ' km' : p.location.address})`).join(', ');

          if (isTelugu) {
            responseText = `నేను మీకు సమీపంలో ${searchResults.length} ముఖ్యమైన ప్రదేశాలను కనుగొన్నాను: ${topNames}. మీరు వీటిలో దేనికైనా వాహనం లేదా తోడుగా సహాయకుడిని బుక్ చేయాలనుకుంటున్నారా?`;
          } else {
            responseText = `I found verified locations near you: ${topNames}. Would you like me to coordinate transportation or companion assistance to any of these?`;
          }
        }

        structuredData = {
          intent: 'PLACES_SEARCH',
          entities: { query: queryText, category, count: searchResults.length },
          suggestedExecutors: dispatchEngine.rankCandidates('TRANSPORTATION', userLocation, new Set<string>()).slice(0, 2),
          requiresConfirmation: false,
          toolCalls,
        };
        break;
      }

      default: {
        if (nlpResult.conversationalReply) {
          session.misunderstandingCount = 0;
          responseText = nlpResult.conversationalReply;
          break;
        }

        // Check for greetings or general conversational hello
        const isGreeting = /^(hi|hello|hey|hey sathi|namaskaram|namaste|good morning|good afternoon|good evening|ela unnaru|kaise ho)/i.test(cleanedInput);
        if (isGreeting) {
          session.misunderstandingCount = 0;
          responseText = isTelugu
            ? "నమస్కారం! నేను సాథిని, మీ వ్యక్తిగత సేవా సహాయకురాలిని. ఈరోజు నేను మీకు ఏ విధంగా సహాయపడగలను?"
            : "Hello! I'm Sathi, your personal voice service coordinator. What can I take care of for you today?";
          break;
        }

        // Check for active status check
        if (cleanedInput.toLowerCase().includes('status') || cleanedInput.toLowerCase().includes('active')) {
          session.misunderstandingCount = 0;
          const activeTask = Array.from(db.tasks.values())
            .filter((t) => t.userId === userId && !['COMPLETED', 'CANCELLED'].includes(t.status))
            .pop();

          if (activeTask) {
            responseText = `Your current task is "${activeTask.title}". Current status: ${activeTask.status.replace(/_/g, ' ')}${
              activeTask.assignedExecutorName ? `, assigned to ${activeTask.assignedExecutorName}` : ''
            }.`;
          } else {
            responseText = "You have no active tasks at the moment. How can I assist you today?";
          }
          break;
        }

        // Graceful contextual recovery for misunderstandings:
        const detectedLang = isTelugu ? 'te' : detectLanguage(cleanedInput);
        responseText = getContextualRecoveryResponse(session, cleanedInput, detectedLang);
        break;
      }
    }

    // Record Sathi's response
    const sathiMsg: AgentMessage = {
      id: `msg_s_${Date.now()}`,
      sender: 'sathi',
      text: responseText,
      timestamp: new Date().toISOString(),
      structuredData,
    };
    session.messages.push(sathiMsg);

    // Audit Sathi invocation
    db.addAuditEvent({
      actor: 'USER',
      actorId: userId,
      action: 'AGENT_SESSION_TURN_COMPLETED',
      resourceType: 'AGENT',
      resourceId: sessionId,
      metadata: {
        inputLength: userInput.length,
        intent: nlpResult.intent,
        toolCallsCount: toolCalls.length,
        isVoice,
      },
      result: 'SUCCESS',
    });

    return sathiMsg;
  }

  /**
   * Understand intent using Gemini API or fallback rule engine
   */
  async understandIntent(
    input: string,
    session: SathiSessionContext,
    memories: string
  ): Promise<{ intent: string; entities: Record<string, any>; conversationalReply?: string }> {
    const ai = getGenAI();
    if (ai && Date.now() >= geminiCooldownUntil) {
      try {
        const historyText = session.messages
          .slice(-6)
          .map((m) => `${m.sender.toUpperCase()}: ${m.text}`)
          .join('\n');

        const prompt = `You are Sathi, a warm, soft-spoken young female AI voice assistant and personal service coordinator.
Your primary responsibility is to understand what the user wants to accomplish, converse naturally in real-time, collect any missing service details (such as pickup location, destination, pharmacy name, items needed, or preferred time), and coordinate a verified human executor.
CRITICAL MULTILINGUAL MANDATE:
Current User Input Language is STRICTLY: ${detectLanguage(input) === 'te' ? 'TELUGU' : detectLanguage(input) === 'hi' ? 'HINDI' : 'ENGLISH'}.
1. If Current User Input Language is ENGLISH, you MUST respond strictly in ENGLISH (e.g. "Hello! I can arrange transportation for you. Where would you like to go?").
2. If Current User Input Language is TELUGU, respond in natural Telugu script (e.g. "నమస్కారం! నేను మీకోసం వాహనాన్ని ఏర్పాటు చేస్తున్నాను.").
3. If Current User Input Language is HINDI, respond in natural Hindi script.
STRICT RULE: Match the language of the Current User Message ("${input}") exactly! Do NOT output Telugu if the current user message is in English!

Supported intents:
- 'SERVICE_REQUEST': User asks for real-world help (medicine pickup, grocery, transport, companion, hospital escort).
- 'CONFIRM_DISPATCH': User agrees/confirms ("yes", "confirm", "proceed", "go ahead", "dispatch", "avunu", "sare").
- 'CANCEL_REASSIGN': User asks to cancel current executor or find someone else ("cancel this executor", "find someone else", "change provider").
- 'APPOINTMENT_REQUEST': User mentions a doctor/clinic visit or hospital appointment.
- 'REMINDER_REQUEST': User asks to be reminded about meds or a task.
- 'PLACES_SEARCH': User asks about nearby places, hospitals, pharmacies, clinics, stores, landmarks, or amenities.
- 'FEEDBACK': User gives feedback or thanks Sathi.
- 'GENERAL_QUERY': Greetings ("hi", "hello", "kaise ho", "ela unnaru") or conversational chat.

User Memory Context: ${memories}

Recent Conversation History:
${historyText || 'No prior messages.'}

Current User Message: "${input}"

Respond ONLY with valid JSON in this structure:
{
  "intent": "SERVICE_REQUEST" | "CONFIRM_DISPATCH" | "CANCEL_REASSIGN" | "APPOINTMENT_REQUEST" | "REMINDER_REQUEST" | "PLACES_SEARCH" | "FEEDBACK" | "GENERAL_QUERY",
  "entities": {
    "serviceType": "MEDICINE_PICKUP" | "GROCERY_ASSISTANCE" | "TRANSPORTATION" | "COMPANION" | "APPOINTMENT" | "OTHER_SERVICE",
    "pharmacy": "pharmacy name or null",
    "items": "items or null",
    "scheduledAt": "time description or null",
    "doctor": "doctor or clinic or null",
    "pickup": "pickup location or null",
    "destination": "destination location or null",
    "transportPreference": "taxi | bike | auto | car or null",
    "duration": "duration or null",
    "title": "title or null",
    "query": "search query for places or null",
    "category": "HOSPITAL | PHARMACY | CLINIC | GROCERY | ALL or null"
  },
  "conversationalReply": "A soft, friendly, concise response spoken as Sathi in the SAME language as the user. If critical details are missing for a service, politely ask for them."
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const text = response.text?.trim() || '{}';
        const parsed = JSON.parse(text);
        if (parsed.intent) {
          return parsed;
        }
      } catch (err: any) {
        const status = err?.status || err?.code || (err?.error && err.error?.code);
        const errMsg = String(err?.message || err);
        const isQuotaExhausted =
          status === 429 ||
          errMsg.includes('429') ||
          errMsg.includes('quota') ||
          errMsg.includes('RESOURCE_EXHAUSTED');
        const isUnavailable =
          status === 503 ||
          errMsg.includes('503') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('high demand');

        if (isQuotaExhausted) {
          // Free tier rate limit (20 req/day). Set 1-minute cooldown before retrying Gemini
          geminiCooldownUntil = Date.now() + 60000;
          console.info('[Sathi NLP] Gemini free-tier daily quota limit reached; activating local deterministic parser.');
        } else if (isUnavailable) {
          geminiCooldownUntil = Date.now() + 30000;
          console.info('[Sathi NLP] Gemini service temporarily unavailable; activating local deterministic parser.');
        } else {
          console.info('[Sathi NLP] Local deterministic parser engaged for user request.');
        }
      }
    }

    // Robust Deterministic Fallback Parser (Supporting Telugu, Hindi, and English)
    const lower = input.toLowerCase();

    if (
      /^(yes|confirm|proceed|ok|okay|do it|dispatch|sure|go ahead|avunu|sare|theek hai|haan|book it|book|yes confirm|please confirm|confirm dispatch|confirm and dispatch)/i.test(lower) ||
      lower.includes('confirm and dispatch') ||
      lower.includes('confirm task') ||
      lower.includes('confirm the task') ||
      lower.includes('confirm dispatch') ||
      lower.includes('dispatch the provider') ||
      lower.includes('dispatch the executor') ||
      lower.includes('yes please')
    ) {
      return { intent: 'CONFIRM_DISPATCH', entities: {} };
    }

    if (
      lower.includes('cancel this executor') ||
      lower.includes('find someone else') ||
      lower.includes('different provider') ||
      lower.includes('change executor') ||
      lower.includes('cancel executor')
    ) {
      return { intent: 'CANCEL_REASSIGN', entities: {} };
    }

    // Location & Place Queries via Google Places Platform
    const isPlaceQuery =
      (lower.includes('find') && (lower.includes('hospital') || lower.includes('pharmacy') || lower.includes('clinic') || lower.includes('store') || lower.includes('doctor') || lower.includes('lab') || lower.includes('grocery'))) ||
      lower.includes('where is') ||
      lower.includes('where are') ||
      lower.includes('nearby') ||
      lower.includes('near me') ||
      lower.includes('in chirala') ||
      lower.includes('in bapatla') ||
      lower.includes('in bangalore') ||
      lower.includes('in bengaluru') ||
      lower.includes('amenities') ||
      lower.includes('locate') ||
      (lower.includes('list') && (lower.includes('hospitals') || lower.includes('pharmacies') || lower.includes('clinics')));

    if (
      isPlaceQuery &&
      !lower.includes('pick me up from') &&
      !lower.includes('at 4 pm') &&
      !lower.includes('at 5 pm') &&
      !lower.includes('need a ride to') &&
      !lower.includes('take me to') &&
      !lower.includes('book a taxi')
    ) {
      const category = lower.includes('hospital')
        ? 'HOSPITAL'
        : lower.includes('pharmacy') || lower.includes('chemist') || lower.includes('medical store')
        ? 'PHARMACY'
        : lower.includes('clinic')
        ? 'CLINIC'
        : lower.includes('grocery') || lower.includes('supermarket') || lower.includes('vegetable')
        ? 'GROCERY'
        : 'ALL';

      return {
        intent: 'PLACES_SEARCH',
        entities: {
          query: input,
          category,
        },
      };
    }

    // One-shot transportation with details provided (e.g. "Tomorrow at 5 PM I need a taxi from my college to the hospital")
    if (
      (lower.includes('taxi') || lower.includes('cab') || lower.includes('ride') || lower.includes('transport') || lower.includes('drive')) &&
      lower.includes('from') &&
      lower.includes('to')
    ) {
      const fromMatch = input.match(/from\s+([A-Za-z0-9\s']+?)(?:\s+to|\s+at|$)/i);
      const toMatch = input.match(/to\s+([A-Za-z0-9\s']+?)(?:\s+at|\s+tomorrow|\s+today|$)/i);
      let scheduledAt = 'Today, 5:00 PM';
      if (lower.includes('tomorrow') && (lower.includes('5 pm') || lower.includes('5pm'))) scheduledAt = 'Tomorrow, 5:00 PM';
      else if (lower.includes('tomorrow')) scheduledAt = 'Tomorrow, 10:00 AM';
      else if (lower.includes('6 pm') || lower.includes('6pm')) scheduledAt = 'Today, 6:00 PM';

      return {
        intent: 'SERVICE_REQUEST',
        entities: {
          serviceType: 'TRANSPORTATION',
          pickup: fromMatch ? fromMatch[1].trim() : 'College',
          destination: toMatch ? toMatch[1].trim() : 'Hospital',
          transportPreference: lower.includes('bike') ? 'bike' : 'taxi',
          scheduledAt,
        },
      };
    }

    if (
      lower.includes('medicine') ||
      lower.includes('pharmacy') ||
      lower.includes('prescription') ||
      lower.includes('tablet') ||
      lower.includes('mandulu') ||
      lower.includes('dawa')
    ) {
      let pharmacy = '';
      if (lower.includes('apollo')) pharmacy = 'Apollo Pharmacy, Indiranagar';
      else if (lower.includes('city pharmacy')) pharmacy = 'City Pharmacy, Indiranagar';
      else if (lower.includes('medplus')) pharmacy = 'MedPlus Pharmacy';
      else {
        const match = input.match(/from\s+([A-Za-z0-9\s]+?)(?:\s+at|\s+tomorrow|\s+today|$)/i);
        if (match) pharmacy = match[1].trim();
      }

      let scheduledAt = 'Today, 5:00 PM';
      if (lower.includes('tomorrow')) scheduledAt = 'Tomorrow, 10:00 AM';
      else if (lower.includes('morning')) scheduledAt = 'Tomorrow, 9:00 AM';
      else if (lower.includes('5 pm') || lower.includes('5pm')) scheduledAt = 'Today, 5:00 PM';

      return {
        intent: 'SERVICE_REQUEST',
        entities: {
          serviceType: 'MEDICINE_PICKUP',
          pharmacy: pharmacy || null,
          items: 'Prescription medicines',
          scheduledAt,
        },
      };
    }

    if (
      lower.includes('shopping') ||
      lower.includes('go for shopping') ||
      lower.includes('go shopping') ||
      lower.includes('grocery') ||
      lower.includes('vegetable') ||
      lower.includes('supermarket') ||
      lower.includes('market') ||
      lower.includes('bazaar') ||
      lower.includes('buy clothes') ||
      lower.includes('milk') ||
      lower.includes('kuragayalu') ||
      lower.includes('sabzi') ||
      lower.includes('angadi')
    ) {
      const isShopping =
        lower.includes('shopping') ||
        lower.includes('market') ||
        lower.includes('bazaar') ||
        lower.includes('buy clothes') ||
        lower.includes('angadi');

      let destination: string | undefined = undefined;
      const toMatch = input.match(/(?:to|at|for)\s+([A-Za-z0-9\s']+?)(?:\s+at|\s+tomorrow|\s+today|$)/i);
      if (toMatch && !toMatch[1].toLowerCase().includes('shopping') && !toMatch[1].toLowerCase().includes('market')) {
        destination = toMatch[1].trim();
      }

      let scheduledAt = 'Today, 4:00 PM';
      if (lower.includes('tomorrow')) scheduledAt = 'Tomorrow, 10:00 AM';
      else if (lower.includes('evening') || lower.includes('5 pm') || lower.includes('6 pm')) scheduledAt = 'Today, 5:00 PM';

      return {
        intent: 'SERVICE_REQUEST',
        entities: {
          serviceType: 'GROCERY_ASSISTANCE',
          items: isShopping ? 'Shopping trip & market accompaniment' : 'Essential groceries & fresh vegetables',
          destination: isShopping ? destination : undefined,
          scheduledAt,
        },
      };
    }

    if (
      lower.includes('transport') ||
      lower.includes('ride') ||
      lower.includes('cab') ||
      lower.includes('drive') ||
      lower.includes('auto') ||
      lower.includes('intiki vellali')
    ) {
      return {
        intent: 'SERVICE_REQUEST',
        entities: {
          serviceType: 'TRANSPORTATION',
          scheduledAt: 'Today, 3:00 PM',
        },
      };
    }

    if (
      lower.includes('doctor') ||
      lower.includes('clinic') ||
      lower.includes('hospital') ||
      lower.includes('appointment') ||
      lower.includes('aaspattri')
    ) {
      const isHospitalVisitDirect = lower.includes('hospital') || lower.includes('aaspattri');
      if (isHospitalVisitDirect) {
        let hospitalName = 'Hospital of Choice';
        const hospMatch = input.match(/(?:to|at)\s+([A-Za-z0-9\s']+?hospital[A-Za-z0-9\s']*)/i);
        if (hospMatch) {
          hospitalName = hospMatch[1].trim();
        } else if (lower.includes('government hospital')) {
          hospitalName = 'Government Hospital Chirala';
        } else if (lower.includes('kims')) {
          hospitalName = 'KIMS Hospital';
        } else if (lower.includes('apollo')) {
          hospitalName = 'Apollo Hospital';
        }

        return {
          intent: 'SERVICE_REQUEST',
          entities: {
            serviceType: 'TRANSPORTATION',
            destination: hospitalName,
            scheduledAt: 'Today, 4:00 PM',
          },
        };
      }

      let doctorName = 'Doctor';
      if (lower.includes('cardio') || lower.includes('meenakshi')) doctorName = 'Cardiologist Dr. Meenakshi';
      else if (lower.includes('sharma')) doctorName = 'Dr. Sharma Clinic';

      return {
        intent: 'APPOINTMENT_REQUEST',
        entities: {
          title: doctorName !== 'Doctor' ? `Appointment with ${doctorName}` : 'Medical Appointment',
          doctor: doctorName !== 'Doctor' ? doctorName : undefined,
          location: lower.includes('cardio') ? 'City Care Cardiology Clinic' : undefined,
          time: new Date(Date.now() + 24 * 3600000).toISOString(),
        },
      };
    }

    if (lower.includes('remind') || lower.includes('reminder') || lower.includes('gurthu cheyyi')) {
      return {
        intent: 'REMINDER_REQUEST',
        entities: {
          title: input.replace(/remind me to/i, '').replace(/gurthu cheyyi/i, '').trim() || 'Health Reminder',
          category: 'MEDICINE',
          time: new Date(Date.now() + 3600000).toISOString(),
        },
      };
    }

    if (
      lower.includes('thank you') ||
      lower.includes('thanks') ||
      lower.includes('great job') ||
      lower.includes('good service') ||
      lower.includes('dhanyavadalu')
    ) {
      return {
        intent: 'FEEDBACK',
        entities: {
          rating: 5,
          feedbackText: input,
        },
      };
    }

    return { intent: 'GENERAL_QUERY', entities: {} };
  }
}

export const sathiAgent = new SathiAgent();
