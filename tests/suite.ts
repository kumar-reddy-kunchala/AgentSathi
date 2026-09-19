// Automated Test Suite for ServiceAgent Core Systems
import { dispatchEngine } from '../server/dispatch';
import { db } from '../server/db';
import { sathiAgent } from '../server/agent';
import { paymentProvider } from '../server/providers';
import { Task, ServiceType, LocationCoordinates } from '../src/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n============================================================');
  console.log('RUNNING SERVICEAGENT DETERMINISTIC TEST SUITE');
  console.log('============================================================\n');

  const testLocation: LocationCoordinates = {
    latitude: 15.8246,
    longitude: 80.3522,
    address: 'Clock Tower Centre, Chirala',
    city: 'Chirala',
  };

  // ----------------------------------------------------
  // TEST GROUP 1: DISPATCH ENGINE ELIGIBILITY & RANKING
  // ----------------------------------------------------
  console.log('--- 1. DISPATCH ENGINE ELIGIBILITY & FILTERING ---');

  // Test 1.1: Only KYC approved & Available executors are eligible
  const eligible = dispatchEngine.getEligibleExecutors('MEDICINE_PICKUP', testLocation, new Set());
  const eligibleIds = eligible.map((e) => e.executor.id);

  assert(eligibleIds.includes('exec_praveen'), 'Praveen (Chirala - KYC Approved & Available) is eligible');
  assert(eligibleIds.includes('exec_vinay'), 'Vinay (Vetapalem - KYC Approved & Available) is eligible');
  assert(!eligibleIds.includes('exec_vikas'), 'Vikas Patel (Under KYC Review) is strictly excluded');
  assert(!eligibleIds.includes('exec_deepa'), 'Deepa Nair (Unavailable toggle) is strictly excluded');

  // Test 1.2: Capability mismatch filtering
  const groceryEligible = dispatchEngine.getEligibleExecutors('GROCERY_ASSISTANCE', testLocation, new Set());
  const groceryIds = groceryEligible.map((e) => e.executor.id);
  assert(groceryIds.includes('exec_praveen'), 'Praveen is eligible for Grocery Assistance');
  assert(!groceryIds.includes('exec_deepa'), 'Deepa (unavailable) is excluded');

  // Test 1.3: Deterministic Candidate Ranking (Praveen in Chirala should be ranked #1 due to 0km proximity & rating)
  const ranked = dispatchEngine.rankCandidates('MEDICINE_PICKUP', testLocation, new Set());
  assert(ranked.length >= 2, 'Found at least 2 eligible candidates');
  assert(ranked[0].executorId === 'exec_praveen', 'Praveen (Chirala, 0km) is deterministically ranked #1');
  assert(ranked[1].executorId === 'exec_vinay', 'Vinay (Vetapalem, 6km) is deterministically ranked #2');

  // ----------------------------------------------------
  // TEST GROUP 2: REJECTION & AUTO REASSIGNMENT
  // ----------------------------------------------------
  console.log('\n--- 2. EXECUTOR REJECTION & REASSIGNMENT WORKFLOW ---');

  // Create a test task
  const taskId = `test_task_${Date.now()}`;
  const testTask: Task = {
    id: taskId,
    userId: 'usr_001',
    userName: 'Ramesh Sharma',
    userPhone: '+91 98765 43210',
    serviceType: 'MEDICINE_PICKUP',
    title: 'Test Medicine Delivery',
    description: 'Blood pressure medicine from City Pharmacy',
    pickupLocation: testLocation,
    destinationLocation: testLocation,
    scheduledAt: 'Today, 5:00 PM',
    requirements: {},
    estimatedCost: 80,
    status: 'CONFIRMED',
    paymentStatus: 'PAYMENT_PENDING',
    verificationStatus: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.tasks.set(taskId, testTask);

  // Start dispatch
  const startResult = dispatchEngine.startDispatch(taskId);
  assert(startResult.success, 'Dispatch started successfully');
  assert(startResult.attempt?.currentExecutorId === 'exec_praveen', 'Initial offer dispatched to Praveen (Chirala)');

  // Praveen rejects the offer
  const rejectResult = dispatchEngine.handleExecutorResponse(
    startResult.attempt!.id,
    'exec_praveen',
    'REJECT'
  );
  assert(rejectResult.success, 'Executor rejection processed successfully');
  assert(Boolean(rejectResult.nextAttempt?.excludedExecutorIds.includes('exec_praveen')), 'Praveen permanently excluded from this attempt');
  assert(rejectResult.nextAttempt?.currentExecutorId === 'exec_vinay', 'Dispatch engine deterministically advanced offer to Vinay (Vetapalem)');

  // Vinay accepts the offer
  const acceptResult = dispatchEngine.handleExecutorResponse(
    rejectResult.nextAttempt!.id,
    'exec_vinay',
    'ACCEPT'
  );
  assert(acceptResult.success, 'Vinay accepted the task');
  assert(acceptResult.task?.status === 'EXECUTOR_ASSIGNED', 'Task status updated to EXECUTOR_ASSIGNED');
  assert(acceptResult.task?.assignedExecutorId === 'exec_vinay', 'Task assigned to Vinay');
  assert(Boolean(acceptResult.task?.verificationCode), 'Two-way completion verification code generated');

  // ----------------------------------------------------
  // TEST GROUP 3: USER CANCELLATION & BACKUP REASSIGNMENT
  // ----------------------------------------------------
  console.log('\n--- 3. USER CANCELS CURRENT EXECUTOR ---');

  const reassignResult = dispatchEngine.cancelExecutorAndReassign(
    taskId,
    'User requested different provider'
  );
  assert(reassignResult.success, 'User cancellation executed successfully');
  assert(Boolean(reassignResult.nextAttempt?.excludedExecutorIds.includes('exec_vinay')), 'Vinay excluded from reassignment attempt');
  assert(reassignResult.nextAttempt?.currentExecutorId === 'exec_kumar', 'Next available candidate (Kumar from Bapatla) contacted');

  // ----------------------------------------------------
  // TEST GROUP 4: NO EXECUTOR AVAILABLE HANDLING
  // ----------------------------------------------------
  console.log('\n--- 4. NO EXECUTOR AVAILABLE FALLBACK ---');

  // Task in remote location outside all service radii
  const remoteLocation: LocationCoordinates = {
    latitude: 14.000,
    longitude: 79.000,
    address: 'Remote Outskirts (150km away)',
    city: 'Remote',
  };
  const remoteRanked = dispatchEngine.rankCandidates('MEDICINE_PICKUP', remoteLocation, new Set());
  assert(remoteRanked.length === 0, 'Zero candidates found for location beyond service radius');

  // ----------------------------------------------------
  // TEST GROUP 5: SATHI AGENT INTENT & ENTITY EXTRACTION
  // ----------------------------------------------------
  console.log('\n--- 5. SATHI AGENT INTENT UNDERSTANDING ---');

  const session = sathiAgent.getOrCreateSession('test_session', 'usr_001');

  const nlp1 = await sathiAgent.understandIntent(
    'Hey Sathi, I need someone to pick up my medicine from Apollo Pharmacy at 5 PM',
    session,
    ''
  );
  assert(nlp1.intent === 'SERVICE_REQUEST', 'Sathi extracts SERVICE_REQUEST intent');
  assert(nlp1.entities.serviceType === 'MEDICINE_PICKUP', 'Sathi extracts MEDICINE_PICKUP');
  assert(nlp1.entities.pharmacy?.includes('Apollo'), 'Sathi extracts Apollo Pharmacy');

  const nlp2 = await sathiAgent.understandIntent(
    'Cancel this executor and find someone else',
    session,
    ''
  );
  assert(nlp2.intent === 'CANCEL_REASSIGN', 'Sathi extracts CANCEL_REASSIGN intent');

  // Test shopping intent recognition (user prompt specific requirement)
  const nlpShop = await sathiAgent.understandIntent(
    'today I need to go for shopping',
    session,
    ''
  );
  assert(nlpShop.intent === 'SERVICE_REQUEST', 'Sathi recognizes "today I need to go for shopping" as SERVICE_REQUEST');
  assert(nlpShop.entities.serviceType === 'GROCERY_ASSISTANCE', 'Sathi maps shopping to GROCERY_ASSISTANCE / shopping accompaniment');

  const shopMsg = await sathiAgent.processUserMessage('sess_shopping_test', 'usr_001', 'today I need to go for shopping');
  assert(!shopMsg.text.includes("I'm here to coordinate real-world services for you—such as medicine pickup"), 'Sathi does not output generic greeting for shopping request');
  assert(shopMsg.text.toLowerCase().includes('shopping') || shopMsg.text.toLowerCase().includes('market'), 'Sathi prepares shopping assistance service plan');

  // ----------------------------------------------------
  // TEST GROUP 6: SATHI MULTI-TURN PROGRESSIVE DISCOVERY
  // ----------------------------------------------------
  console.log('\n--- 6. SATHI MULTI-TURN PROGRESSIVE DISCOVERY ---');

  // Multi-turn Travel Scenario: "I need to go home"
  const turn1 = await sathiAgent.processUserMessage('sess_home', 'usr_001', 'I need to go home');
  assert(turn1.text.includes('bike or a taxi'), 'Step 1: Sathi inquires about transport preference');

  const turn2 = await sathiAgent.processUserMessage('sess_home', 'usr_001', 'Taxi');
  assert(turn2.text.includes('pick you up from'), 'Step 2: Sathi inquires about pickup location');

  const turn3 = await sathiAgent.processUserMessage('sess_home', 'usr_001', "St. Ann's College");
  assert(turn3.text.includes('destination'), 'Step 3: Sathi inquires about destination');

  const turn4 = await sathiAgent.processUserMessage('sess_home', 'usr_001', 'My home in Chirala');
  assert(turn4.text.includes('time'), 'Step 4: Sathi inquires about departure time');

  const turn5 = await sathiAgent.processUserMessage('sess_home', 'usr_001', 'At 6 PM');
  assert(turn5.text.includes("St. Ann's College") && turn5.text.includes('Chirala'), 'Step 5: Sathi summarizes and requests confirmation');
  assert(turn5.structuredData?.requiresConfirmation === true, 'Task confirmation card is presented before dispatch');

  // Multi-turn Hospital Visit Scenario: "Sathi, I want to go to the hospital"
  const hTurn1 = await sathiAgent.processUserMessage('sess_hosp', 'usr_001', 'Sathi, I want to go to the hospital');
  assert(hTurn1.text.includes('When would you like to go'), 'Hospital Step 1: Sathi inquires about visit time');

  const hTurn2 = await sathiAgent.processUserMessage('sess_hosp', 'usr_001', 'At 4 PM');
  assert(hTurn2.text.includes('Where should I pick you up from'), 'Hospital Step 2: Sathi inquires about pickup');

  const hTurn3 = await sathiAgent.processUserMessage('sess_hosp', 'usr_001', 'Indiranagar flat');
  assert(hTurn3.text.includes('Which hospital'), 'Hospital Step 3: Sathi inquires about hospital name');

  const hTurn4 = await sathiAgent.processUserMessage('sess_hosp', 'usr_001', 'Government Hospital Chirala');
  assert(hTurn4.text.includes('how long will you need'), 'Hospital Step 4: Sathi inquires about duration');

  const hTurn5 = await sathiAgent.processUserMessage('sess_hosp', 'usr_001', 'About two hours');
  assert(hTurn5.text.includes('Government Hospital Chirala') && hTurn5.text.includes('4 PM'), 'Hospital Step 5: Sathi summarizes and requests confirmation');
  assert(Boolean(hTurn5.structuredData?.taskPlan?.title?.includes('Government Hospital')), 'Hospital assistance task generated');

  // Multilingual Telugu Trigger
  const teTurn = await sathiAgent.processUserMessage('sess_te', 'usr_001', 'Nenu intiki vellali');
  assert(teTurn.text.includes('బైక్') || teTurn.text.includes('టాక్సీ'), 'Sathi responds naturally in Telugu');

  // ----------------------------------------------------
  // TEST GROUP 7: AUDIT TRAIL RECORDING
  // ----------------------------------------------------
  console.log('\n--- 7. AUDIT TRAIL LOGGING ---');
  const recentLogs = db.auditLogs.slice(0, 5);
  assert(recentLogs.length > 0, 'Audit logs actively recorded in database');
  assert(
    recentLogs.some((l) => l.action.includes('EXECUTOR') || l.action.includes('DISPATCH') || l.action.includes('AGENT')),
    'Lifecycle state transitions auditable'
  );

  console.log('\n============================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((e) => {
  console.error('Test runner failed:', e);
  process.exit(1);
});
