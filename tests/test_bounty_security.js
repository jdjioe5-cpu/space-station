const assert = require('assert');
const BountySecurityEngine = require('../security/bounty_security_engine');

async function runSecurityTests() {
    console.log('🧪 Starting MYZ Bounty Security & Anti-Sybil Tests...');

    const engine = new BountySecurityEngine();

    // 1. Successful First Claim
    const res1 = engine.processRewardClaim({
        identityId: 'PIONEER_ALICE',
        bountyId: 'BNT_CANOPY_AUDIT',
        idempotencyKey: 'IDEMP_001',
        amountMYZ: 100
    });
    assert.strictEqual(res1.record.state, 'PAID');
    assert.strictEqual(res1.record.riskScore, 0);
    assert(res1.record.signature.length === 64);
    console.log(`  ✅ 1. Valid bounty claim processed & signed [${res1.record.signature.substring(0, 16)}...]`);

    // 2. Idempotency Test (Duplicate Network Packet Replay)
    const resIdemp = engine.processRewardClaim({
        identityId: 'PIONEER_ALICE',
        bountyId: 'BNT_CANOPY_AUDIT',
        idempotencyKey: 'IDEMP_001',
        amountMYZ: 100
    });
    assert.strictEqual(resIdemp.isReentrant, true);
    assert.strictEqual(resIdemp.record.rewardId, res1.record.rewardId);
    console.log('  ✅ 2. Idempotency key recognized: Safely returned cached receipt without double payout');

    // 3. Sybil Defense: Block Duplicate Claim on Same Bounty
    assert.throws(() => {
        engine.processRewardClaim({
            identityId: 'PIONEER_ALICE',
            bountyId: 'BNT_CANOPY_AUDIT',
            idempotencyKey: 'IDEMP_002', // new idempotency key, same user & bounty
            amountMYZ: 100
        });
    }, /Duplicate reward blocked/);
    console.log('  ✅ 3. Duplicate claim blocked by (identityId + bountyId) uniqueness constraint');

    // 4. Anomaly Detection & Manual Review Threshold Flagging
    const suspicious = engine.processRewardClaim({
        identityId: 'BOT_FARMER_X',
        bountyId: 'BNT_SOLAR_PROBE',
        idempotencyKey: 'IDEMP_003',
        amountMYZ: 250,
        metadata: { isNewcomer: true, telemetryAnomaly: true } // 20 + 30 = 50 + velocity = high
    });
    // First claim gets 50 risk
    assert.strictEqual(suspicious.record.state, 'PAID');

    // Burst claim immediately: triggers velocity spike (+45) -> 50 + 45 = 95 >= 70 threshold
    const flagged = engine.processRewardClaim({
        identityId: 'BOT_FARMER_X',
        bountyId: 'BNT_ORBIT_TELEMETRY',
        idempotencyKey: 'IDEMP_004',
        amountMYZ: 250,
        metadata: { isNewcomer: true, telemetryAnomaly: true }
    });
    assert.strictEqual(flagged.record.state, 'FLAGGED_MANUAL_REVIEW');
    assert.strictEqual(flagged.record.riskScore, 95);
    console.log(`  ✅ 4. High-risk velocity attack flagged for manual review (riskScore=${flagged.record.riskScore})`);

    // 5. Manual Review Approval Path
    const approved = engine.approveManualReview(flagged.record.rewardId, 'ADMIN_DANIEL');
    assert.strictEqual(approved.state, 'PAID');
    assert.strictEqual(approved.approvedBy, 'ADMIN_DANIEL');
    console.log('  ✅ 5. Manual review approval path transitions reward to PAID status');

    console.log('🎉 All MYZ Bounty Security & Anti-Sybil tests passed 100%!');
}

runSecurityTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
