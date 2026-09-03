const assert = require('assert');
const MetaverseBountyEngine = require('../engine/metaverse_bounty_engine');

async function runEngineTests() {
    console.log('🧪 Starting Metaverse Bounty Engine Tests...');

    const engine = new MetaverseBountyEngine();

    // 1. Create Bounty
    const bounty = engine.createBounty({
        bountyId: 'BNT_LIFE_001',
        title: 'Orto Botanico Canopy Sensor Audit',
        issuer: 'PARTNER_ORTO_ROMA',
        zoneId: 'ZONE_ORTO_ROMA',
        proofType: 'SENSOR_DATA',
        rewards: { myz: 75, xp: 300, reputation: 20 }
    });
    assert.strictEqual(bounty.status, 'AVAILABLE');
    console.log('  ✅ 1. Metaverse bounty created and published to AVAILABLE state');

    // 2. Claim Bounty
    const claim = engine.claimBounty('BNT_LIFE_001', 'AGENT_OPERATOR_01');
    assert.strictEqual(claim.status, 'IN_PROGRESS');
    console.log('  ✅ 2. Bounty claimed and transitioned to IN_PROGRESS');

    // 3. Duplicate Claim Rejection
    assert.throws(() => {
        engine.claimBounty('BNT_LIFE_001', 'AGENT_OPERATOR_01');
    }, /already claimed/);
    console.log('  ✅ 3. Duplicate claim prevented by identity guard');

    // 4. Submit Proof
    const submitted = engine.submitProof('BNT_LIFE_001', 'AGENT_OPERATOR_01', {
        telemetryFingerprint: 'sha256_canopy_774912'
    });
    assert.strictEqual(submitted.status, 'SUBMITTED');
    console.log('  ✅ 4. Sensor telemetry proof successfully submitted');

    // 5. Validate and Disburse Reward
    const receipt = engine.validateAndReward('BNT_LIFE_001', 'AGENT_OPERATOR_01', 'VAL_ROMA_TRE');
    assert.strictEqual(receipt.status, 'REWARDED');
    assert.strictEqual(receipt.amountMYZ, 75);
    assert(receipt.signature.length === 64);
    console.log(`  ✅ 5. Reward validated & disbursed with SHA-256 signature [${receipt.signature.substring(0, 16)}...]`);

    // 6. Double Reward Prevention
    assert.throws(() => {
        engine.validateAndReward('BNT_LIFE_001', 'AGENT_OPERATOR_01', 'VAL_ROMA_TRE');
    }, /Cannot reward claim|already disbursed/);
    console.log('  ✅ 6. Replay attack blocked: double reward safely rejected');

    console.log('🎉 All Metaverse Bounty Engine tests passed 100%!');
}

runEngineTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
