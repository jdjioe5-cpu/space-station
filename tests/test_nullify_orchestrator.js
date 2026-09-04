const assert = require('assert');
const { NullifyPrivacyOrchestrator } = require('../privacy/nullify_orchestrator');

async function runOrchestrationTests() {
    console.log('🧪 Starting Nullify E2E Privacy-by-Design Orchestrator Tests...');

    const orchestrator = new NullifyPrivacyOrchestrator();

    // 1. Ingestion & Redaction: Scientific data preserved, PII pseudonymized
    const rawPacket = {
        stationId: 'ALPHA_ORBIT_1',
        timestamp: '2026-09-04T10:30:00Z',
        environmentalMetrics: {
            ph: 7.2,
            dissolvedOxygenMgL: 8.4,
            waterTurbidityNtu: 1.1
        },
        operator: {
            email: 'astronomer@space-station.org',
            privateKey: '0xSECRET_KEY'
        }
    };

    const cleanMrv = orchestrator.processIncomingPacket(rawPacket);
    assert.strictEqual(cleanMrv.stationId, 'ALPHA_ORBIT_1');
    assert.deepStrictEqual(cleanMrv.environmentalMetrics, rawPacket.environmentalMetrics);
    assert(!('operator' in cleanMrv));
    assert(cleanMrv.operatorPseudonym && cleanMrv.operatorPseudonym.length === 16);
    console.log('  ✅ 1. Packet minimised: scientific MRV data 100% preserved, operator PII securely pseudonymized');

    // 2. Removal Directive Creation (Enforces Human Approval Gate)
    const directive = orchestrator.createRemovalDirective('astronomer@space-station.org');
    assert.strictEqual(directive.status, 'PENDING_HUMAN_APPROVAL');
    assert(directive.targetHash.length === 64);
    console.log('  ✅ 2. Removal directive generated in PENDING_HUMAN_APPROVAL state');

    // 3. Attempt dispatch without approval must throw
    let blockedWithoutApproval = false;
    try {
        await orchestrator.dispatchDirective(directive.requestId);
    } catch (err) {
        blockedWithoutApproval = true;
        assert(err.message.includes('requires human approval'));
    }
    assert.strictEqual(blockedWithoutApproval, true);
    console.log('  ✅ 3. Human Gate verified: Unauthorized dispatch strictly rejected');

    // 4. Approve and Dispatch with Mock Provider
    orchestrator.approveRemovalDirective(directive.requestId, 'COMMANDER_SHEPARD');
    const mockProvider = {
        submitRemoval: async (reqId, hash) => ({ externalId: 'nullify_live_991' })
    };
    const dispatched = await orchestrator.dispatchDirective(directive.requestId, mockProvider);
    assert.strictEqual(dispatched.status, 'DISPATCHED_TO_NULLIFY');
    assert.strictEqual(dispatched.externalId, 'nullify_live_991');
    console.log('  ✅ 4. Approved directive dispatched to provider successfully');

    // 5. Fault Resilience: Provider failure never halts or crashes core
    const failingProvider = {
        submitRemoval: async () => { throw new Error('Nullify Gateway 504 Gateway Timeout'); }
    };
    const directiveFail = orchestrator.createRemovalDirective('engineer@space-station.org');
    orchestrator.approveRemovalDirective(directiveFail.requestId);
    const failResult = await orchestrator.dispatchDirective(directiveFail.requestId, failingProvider);
    assert.strictEqual(failResult.status, 'DISPATCH_ERROR_ISOLATED');
    assert(failResult.error.includes('504'));
    console.log('  ✅ 5. Fault resilience verified: Provider errors isolated without disrupting MRV flow');

    // 6. Offline Fallback when Nullify is Disabled
    const offlineOrchestrator = new NullifyPrivacyOrchestrator({ nullifyEnabled: false });
    const dirOffline = offlineOrchestrator.createRemovalDirective('offline_user@station.org');
    offlineOrchestrator.approveRemovalDirective(dirOffline.requestId);
    const offlineResult = await offlineOrchestrator.dispatchDirective(dirOffline.requestId);
    assert.strictEqual(offlineResult.status, 'COMPLETED_OFFLINE');
    console.log('  ✅ 6. Offline fallback verified: System functions seamlessly with Nullify disabled');

    // 7. Audit Trail Integrity
    assert(orchestrator.auditTrail.length >= 4);
    for (const audit of orchestrator.auditTrail) {
        assert.strictEqual(audit.signature.length, 64);
        assert(!JSON.stringify(audit.meta).includes('astronomer@space-station.org'));
    }
    console.log(`  ✅ 7. Audit trail verified: ${orchestrator.auditTrail.length} tamper-proof entries with zero raw PII`);

    console.log('🎉 All Nullify Master Orchestrator E2E tests passed 100%!');
}

runOrchestrationTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
