const assert = require('assert');
const ValidatorWorkflowEngine = require('../validation/validator_workflow_engine');

async function runValidationTests() {
    console.log('🧪 Starting Scientific & Partner Validation Workflow Tests...');

    const engine = new ValidatorWorkflowEngine();

    // 1. Register Academic Validator
    const validator = engine.registerValidator('VAL_ROMA_TRE', {
        organization: 'Università degli Studi Roma Tre',
        role: 'ACADEMIC_PARTNER'
    });
    assert.strictEqual(validator.validatorId, 'VAL_ROMA_TRE');
    assert.strictEqual(validator.role, 'ACADEMIC_PARTNER');
    console.log('  ✅ 1. Academic partner validator successfully registered');

    // 2. Submit Evidence Package to Review Queue
    const queueItem = engine.submitPackageForReview({
        packageId: 'PKG_LIFE_001',
        zoneId: 'ZONE_ORTO_ROME',
        evidenceHash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90'
    });
    assert.strictEqual(queueItem.status, 'PENDING_REVIEW');
    assert.strictEqual(engine.getPendingQueue().length, 1);
    console.log('  ✅ 2. Evidence package queued for scientific evaluation');

    // 3. Process Scientific Approval Decision
    const attestation = engine.processDecision(queueItem.queueId, 'VAL_ROMA_TRE', {
        decision: 'APPROVED',
        noConflictOfInterest: true,
        notes: 'Ground-truth microclimate sensor validation confirmed with 99.4% accuracy.'
    });

    assert.strictEqual(attestation.decision, 'APPROVED');
    assert.strictEqual(attestation.isPartnerValidated, true);
    assert.strictEqual(attestation.noConflictOfInterest, true);
    assert(attestation.signatureReference.length === 64);
    console.log(`  ✅ 3. Attestation approved with SHA-256 signature [${attestation.signatureReference.substring(0, 16)}...]`);

    // 4. Verify Review Queue Updated
    assert.strictEqual(engine.getPendingQueue().length, 0);
    console.log('  ✅ 4. Queue cleared and item archived with audit trail');

    console.log('🎉 All Scientific & Partner Validation tests passed 100%!');
}

runValidationTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
