const assert = require('assert');
const fs = require('fs');
const MetaverseBountyEngine = require('../engine/metaverse_bounty_engine');

async function runEngineTests() {
    console.log('🧪 Starting Metaverse Bounty Engine Tests (Deterministic Lifecycle & Durable Guards)...');

    const tempJournal = '/tmp/test_metaverse_replay_' + Date.now() + '.json';
    const engine = new MetaverseBountyEngine({ storagePath: tempJournal });

    // 1. Create Bounty (Starts in DRAFT)
    const bounty = engine.createBounty({
        bountyId: 'BNT_LIFE_001',
        title: 'Orto Botanico Canopy Sensor Audit',
        issuer: 'PARTNER_ORTO_ROMA',
        zoneId: 'ZONE_ORTO_ROMA',
        proofType: 'SENSOR_DATA',
        rewards: { myz: 75, xp: 300, reputation: 20 }
    });
    assert.strictEqual(bounty.status, 'DRAFT');
    console.log('  ✅ 1. Bounty created in DRAFT state per lifecycle specification');

    // 2. NEGATIVE TEST: Direct claim from DRAFT is rejected (Bypassing lifecycle)
    assert.throws(() => {
        engine.claimBounty('BNT_LIFE_001', 'AGENT_OPERATOR_01');
    }, /Cannot claim bounty in status DRAFT/);
    console.log('  ✅ 2. Negative Test: Cannot claim bounty directly from DRAFT (bypass prevented)');

    // 3. Publish Bounty (DRAFT -> PUBLISHED -> AVAILABLE)
    engine.publishBounty('BNT_LIFE_001');
    assert.strictEqual(bounty.status, 'AVAILABLE');
    console.log('  ✅ 3. Bounty transitioned to AVAILABLE via formal publish lifecycle');

    // 4. Claim Bounty (AVAILABLE -> CLAIMED) & Start Work (CLAIMED -> IN_PROGRESS)
    const claim = engine.claimBounty('BNT_LIFE_001', 'AGENT_OPERATOR_01');
    assert.strictEqual(claim.status, 'CLAIMED');
    engine.startWork('BNT_LIFE_001', 'AGENT_OPERATOR_01');
    assert.strictEqual(claim.status, 'IN_PROGRESS');
    console.log('  ✅ 4. Bounty claimed and transitioned to IN_PROGRESS');

    // 5. NEGATIVE TEST: Malformed proofData rejected fail-closed
    assert.throws(() => {
        engine.submitProof('BNT_LIFE_001', 'AGENT_OPERATOR_01', { invalidField: true });
    }, /SENSOR_DATA proof requires valid telemetryFingerprint/);
    console.log('  ✅ 5. Negative Test: Malformed proof payload is rejected');

    // 6. Submit Valid Proof (IN_PROGRESS -> SUBMITTED)
    engine.submitProof('BNT_LIFE_001', 'AGENT_OPERATOR_01', {
        telemetryFingerprint: 'sha256_canopy_sensor_884912048123',
        reading: 24.5
    });
    assert.strictEqual(claim.status, 'SUBMITTED');
    console.log('  ✅ 6. Valid proof submitted and transitioned to SUBMITTED');

    // 7. NEGATIVE TEST: Direct reward from SUBMITTED (skipping validation) is rejected
    assert.throws(() => {
        engine.disburseReward('BNT_LIFE_001', 'AGENT_OPERATOR_01', 'VAL_ROMA_TRE');
    }, /Invalid state transition.*cannot transition from SUBMITTED to REWARDED/);
    console.log('  ✅ 7. Negative Test: Skipping validation is strictly blocked by state machine');

    // 8. NEGATIVE TEST: Unauthorized validator rejected
    assert.throws(() => {
        engine.startValidation('BNT_LIFE_001', 'AGENT_OPERATOR_01', 'ROGUE_VALIDATOR_007');
    }, /Validator authorization failed/);
    console.log('  ✅ 8. Negative Test: Unauthorized validator rejected');

    // 9. Authorized Validation Flow (SUBMITTED -> VALIDATION -> APPROVED -> REWARDED)
    engine.startValidation('BNT_LIFE_001', 'AGENT_OPERATOR_01', 'VAL_ROMA_TRE');
    assert.strictEqual(claim.status, 'VALIDATION');

    engine.approveValidation('BNT_LIFE_001', 'AGENT_OPERATOR_01', 'VAL_ROMA_TRE');
    assert.strictEqual(claim.status, 'APPROVED');

    const receipt = engine.disburseReward('BNT_LIFE_001', 'AGENT_OPERATOR_01', 'VAL_ROMA_TRE');
    assert.strictEqual(receipt.status, 'REWARDED');
    assert.strictEqual(receipt.amountMYZ, 75);
    assert(receipt.receiptDigest.length === 64);
    assert(receipt.receiptSignature.length === 64);
    assert(receipt.receiptId.startsWith('RCP_'));
    console.log(`  ✅ 9. Authorized validation completed: receiptDigest [${receipt.receiptDigest.substring(0, 16)}...], receiptSig [${receipt.receiptSignature.substring(0, 16)}...]`);

    // 10. NEGATIVE TEST: Durable Replay Protection survives engine restart
    const restartedEngine = new MetaverseBountyEngine({ storagePath: tempJournal });
    assert.throws(() => {
        restartedEngine.disburseReward('BNT_LIFE_001', 'AGENT_OPERATOR_01', 'VAL_ROMA_TRE');
    }, /Durable replay protection/);
    console.log('  ✅ 10. Durable Replay: Double-payout rejected across process restart/instance reload');

    // 11. Nullish Coalescing Test: Intentional 0 MYZ reward preserved
    const zeroBounty = engine.createBounty({
        bountyId: 'BNT_ZERO_001',
        title: 'Community Honor Quest',
        rewards: { myz: 0, xp: 50, reputation: 5 }
    });
    assert.strictEqual(zeroBounty.rewards.myz, 0, 'Intentional 0 MYZ must not default to 50');
    console.log('  ✅ 11. Nullish Coalescing: Intentional 0 MYZ reward correctly preserved');

    // Cleanup
    try { fs.unlinkSync(tempJournal); } catch (e) {}

    console.log('🎉 All Metaverse Bounty Engine lifecycle and security tests passed 100%!');
}

runEngineTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
