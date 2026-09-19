# Sathi AI Agent Architecture

Sathi is a compassionate, voice-first service coordination agent designed specifically for seniors and assisted living individuals.

## Core Capabilities

1. **Voice-First Conversational Loop**:
   - Wake phrase detection (`"Hey Sathi"`).
   - In-browser speech recognition with immediate voice feedback (text-to-speech).
   - Concise, respectful, human-like voice responses (under 35 words).

2. **Gemini 3.8 Flash SDK Integration**:
   - Model: `@google/genai` using model `gemini-3.8-flash`.
   - Temperature: `0.1` for consistent, reliable structured intent parsing.
   - Grounded in platform knowledge documents (safety protocols, emergency helpline escalation, pricing rules).

3. **High-Availability Deterministic Fallback**:
   - If network or API quota limits (such as transient 503 spikes) occur, Sathi automatically engages an in-memory deterministic regex and rule parser.
   - The user experience remains uninterrupted, extracting intent, service type, time, and location reliably.

4. **Task Plan Formulation**:
   - Sathi extracts: `ServiceType`, `Title`, `PickupLocation`, `DestinationLocation`, `ScheduledTime`, `EstimatedFee`.
   - Rather than creating an unconfirmed assignment, Sathi returns an interactive **Task Plan Card** with explicit confirmation actions.

5. **Audited Context & Memory**:
   - Stores user preferences (preferred pharmacy, dietary constraints, preferred appointment hospital).
   - The user has complete visibility and control over Sathi's remembered preferences via `/user` (Memory & Preferences tab).
