const assert = require('assert');
const EnvironmentalRewardPolicyEngine = require('../rewards/environmental_reward_policy_engine');

async function runRewardTests() {
    console.log('🧪 Starting Environmental Reward Policy Tests...');

    const engine = new EnvironmentalRewardPolicyEngine();

    // 1. Test Tier Calculation
    assert.strictEqual(engine.calculateReward('UNVERIFIED'), 0);
    assert.strictEqual(engine.calculateReward('VERIFIED_PHYSICAL'), 100);
    assert.strictEqual(engine.calculateReward('PARTNER_VALIDATED'), 250);
    console.log('  ✅ 1. Reward tiers correctly calculated based on evidence level');

    // 2. Disburse Valid Reward
    const receipt = engine.disburseReward({
        claimId: 'CLAIM_ECO_001',
        recipient: '0x21d6630ECcB68a34aF6Dd052786746BEb5dD9b9e',
        evidenceLevel: 'PARTNER_VALIDATED',
        zoneId: 'ZONE_ORTO_ROME'
    });
    assert.strictEqual(receipt.amountMYZ, 250);
    assert.strictEqual(receipt.status, 'DISBURSED');
    assert(receipt.receiptSignature.length === 64);
    console.log(`  ✅ 2. Valid reward disbursed with receipt signature [${receipt.receiptSignature.substring(0, 16)}...]`);

    // 3. Test Anti-Replay / Double Payout Rejection
    assert.throws(() => {
        engine.disburseReward({
            claimId: 'CLAIM_ECO_001',
            recipient: '0x21d6630ECcB68a34aF6Dd052786746BEb5dD9b9e',
            evidenceLevel: 'PARTNER_VALIDATED'
        });
    }, /Double-reward attempt rejected/);
    console.log('  ✅ 3. Double-reward attempt safely blocked by idempotency guard');

    // 4. Test Revoke Workflow
    const revoked = engine.revokeReward('CLAIM_ECO_001', 'Sensor calibration anomaly');
    assert.strictEqual(revoked.status, 'REVOKED');
    console.log('  ✅ 4. Revocation workflow verified with audit reason recorded');

    console.log('🎉 All Environmental Reward Policy tests passed 100%!');
}

runRewardTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
