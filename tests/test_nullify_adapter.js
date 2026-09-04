const assert = require('assert');
const { NullifyAdapterService, MockNullifyProvider } = require('../privacy/nullify_adapter');

async function runNullifyTests() {
    console.log('🧪 Starting Nullify Adapter & Privacy Workflow Tests...');

    const mockProvider = new MockNullifyProvider();
    const service = new NullifyAdapterService(mockProvider);

    // 1. Create Privacy Removal Request (Hashes only, zero PII)
    const targetHash = '0x9fae81b2c4d6e8f01234567890abcdef1234567890abcdef1234567890abcdef';
    const req = service.createRemovalRequest(targetHash);
    assert.strictEqual(req.status, 'PENDING_APPROVAL');
    assert.strictEqual(req.approvedByHuman, false);
    console.log(`  ✅ 1. Privacy removal request created: ${req.requestId} in PENDING_APPROVAL state`);

    // 2. Human Approval Gate
    const approved = service.approveRequest(req.requestId, 'DIRECTOR_LOGAN');
    assert.strictEqual(approved.approvedByHuman, true);
    assert.strictEqual(approved.approvedBy, 'DIRECTOR_LOGAN');
    console.log('  ✅ 2. Human approval gate signed off request');

    // 3. Dispatch to Mock Provider
    const dispatched = await service.dispatchToProvider(req.requestId);
    assert.strictEqual(dispatched.status, 'SUBMITTED');
    assert(dispatched.externalProviderId.startsWith('nullify_ext_'));
    console.log(`  ✅ 3. Dispatched to provider: External ID ${dispatched.externalProviderId}`);

    // 4. Offline Fallback (Core operates when Nullify is disabled)
    const offlineService = new NullifyAdapterService(mockProvider, { enabled: false });
    const reqOffline = offlineService.createRemovalRequest('0xHASH_OFFLINE_TEST');
    offlineService.approveRequest(reqOffline.requestId);
    const offlineResult = await offlineService.dispatchToProvider(reqOffline.requestId);
    assert.strictEqual(offlineResult.status, 'COMPLETED_OFFLINE');
    console.log('  ✅ 4. Offline fallback confirmed: Core operates seamlessly when Nullify is disabled');

    // 5. Fault Tolerance: External failure does not throw or crash
    const failingProvider = {
        submitRemoval: async () => { throw new Error('Nullify 503 Service Unavailable'); }
    };
    const resilientService = new NullifyAdapterService(failingProvider);
    const reqFail = resilientService.createRemovalRequest('0xHASH_FAIL_TEST');
    resilientService.approveRequest(reqFail.requestId);
    const failResult = await resilientService.dispatchToProvider(reqFail.requestId);
    assert(failResult.dispatchError.includes('503'));
    console.log('  ✅ 5. Fault tolerance verified: External provider error isolated without crashing MRV');

    // 6. Zero PII Audit Log Verification
    assert(service.auditLog.length >= 3);
    for (const entry of service.auditLog) {
        assert(!('operatorEmail' in entry.meta));
        assert(!('walletPrivateKey' in entry.meta));
        assert.strictEqual(entry.signature.length, 64);
    }
    console.log(`  ✅ 6. Audit log recorded ${service.auditLog.length} events with zero raw PII and valid SHA-256 signatures`);

    console.log('🎉 All Nullify Adapter & Privacy Workflow tests passed 100%!');
}

runNullifyTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
