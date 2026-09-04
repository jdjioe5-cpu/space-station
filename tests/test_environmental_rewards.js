const assert = require('assert');
const EnvironmentalRewardPolicyEngine = require('../rewards/environmental_reward_policy_engine');

async function runRewardTests() {
    console.log('🧪 Starting Environmental Reward Policy Tests (Hardened Trust Model)...');

    const engine = new EnvironmentalRewardPolicyEngine();

    // 1. Test Tier Calculation
    assert.strictEqual(engine.calculateReward('UNVERIFIED'), 0);
    assert.strictEqual(engine.calculateReward('SELF_REPORTED'), 25);
    assert.strictEqual(engine.calculateReward('VERIFIED_PHYSICAL'), 100);
    assert.strictEqual(engine.calculateReward('PARTNER_VALIDATED'), 250);
    console.log('  ✅ 1. Reward tiers correctly mapped (0, 25, 100, 250 MYZ)');

    // 2. NEGATIVE TEST: Self-declared PARTNER_VALIDATED without validator/attestation MUST FAIL CLOSED
    assert.throws(() => {
        engine.disburseReward({
            claimId: 'CLAIM_ATTACK_001',
            recipient: '0xAttackerAddress0000000000000000000000000',
            evidenceLevel: 'PARTNER_VALIDATED'
        });
    }, /Self-declaration not permitted for PARTNER_VALIDATED tier/);
    console.log('  ✅ 2. Negative Test: Self-declared PARTNER_VALIDATED without validator is rejected fail-closed');

    // 3. NEGATIVE TEST: Unauthorized / Unknown validator attempting PARTNER_VALIDATED is rejected
    assert.throws(() => {
        engine.disburseReward({
            claimId: 'CLAIM_ATTACK_002',
            recipient: '0xAttackerAddress0000000000000000000000000',
            evidenceLevel: 'PARTNER_VALIDATED',
            validatorId: 'FAKE_VALIDATOR_ROGUE',
            evidenceHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            attestation: { signature: 'dummy-signature' }
        });
    }, /Unauthorized or missing validator identity/);
    console.log('  ✅ 3. Negative Test: Rogue / unauthorized validator is safely blocked');

    // 4. NEGATIVE TEST: Forged or tampered attestation signature is rejected
    assert.throws(() => {
        engine.disburseReward({
            claimId: 'CLAIM_ATTACK_003',
            recipient: '0xAttackerAddress0000000000000000000000000',
            evidenceLevel: 'PARTNER_VALIDATED',
            validatorId: 'VALIDATOR_ARPA_01',
            evidenceHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            attestation: { signature: 'bad_signature_deadbeefcafebabedeadbeefcafebabe' }
        });
    }, /Cryptographic attestation signature mismatch/);
    console.log('  ✅ 4. Negative Test: Tampered cryptographic signature rejected');

    // 5. POSITIVE TEST: Legitimate authorized partner attestation successfully unlocks 250 MYZ
    const testEvidenceHash = 'a4b1c2d3e4f506172839405162738495a4b1c2d3e4f506172839405162738495';
    const validAttestation = engine.createAttestation('CLAIM_ECO_VALID_001', 'VALIDATOR_ARPA_01', testEvidenceHash);

    const receipt = engine.disburseReward({
        claimId: 'CLAIM_ECO_VALID_001',
        recipient: '0x21d6630ECcB68a34aF6Dd052786746BEb5dD9b9e',
        evidenceLevel: 'PARTNER_VALIDATED',
        validatorId: 'VALIDATOR_ARPA_01',
        evidenceHash: testEvidenceHash,
        attestation: validAttestation,
        zoneId: 'ZONE_ORTO_ROME'
    });

    assert.strictEqual(receipt.amountMYZ, 250);
    assert.strictEqual(receipt.status, 'DISBURSED');
    assert.strictEqual(receipt.validatedBy, 'VALIDATOR_ARPA_01');
    assert.strictEqual(typeof receipt.receiptDigest, 'string');
    assert.strictEqual(receipt.receiptDigest.length, 64);
    assert(receipt.receiptId.startsWith('RCP_'));
    console.log(`  ✅ 5. Positive Test: Authorized partner attestation disbursed 250 MYZ with receiptDigest [${receipt.receiptDigest.substring(0, 16)}...]`);

    // 6. Anti-Replay / Double Payout Rejection
    assert.throws(() => {
        engine.disburseReward({
            claimId: 'CLAIM_ECO_VALID_001',
            recipient: '0x21d6630ECcB68a34aF6Dd052786746BEb5dD9b9e',
            evidenceLevel: 'PARTNER_VALIDATED',
            validatorId: 'VALIDATOR_ARPA_01',
            evidenceHash: testEvidenceHash,
            attestation: validAttestation
        });
    }, /Double-reward attempt rejected/);
    console.log('  ✅ 6. Anti-Replay: Double-reward attempt safely blocked by idempotency guard');

    // 7. Revocation Workflow
    const revoked = engine.revokeReward('CLAIM_ECO_VALID_001', 'Sensor calibration post-audit anomaly');
    assert.strictEqual(revoked.status, 'REVOKED');
    assert.strictEqual(revoked.revocationReason, 'Sensor calibration post-audit anomaly');
    console.log('  ✅ 7. Revocation: Workflow verified with audit reason recorded');

    // 8. Zero Reward for Unverified Claim
    const zeroReceipt = engine.disburseReward({
        claimId: 'CLAIM_UNVERIFIED_002',
        evidenceLevel: 'UNVERIFIED'
    });
    assert.strictEqual(zeroReceipt.status, 'REJECTED_ZERO_REWARD');
    assert.strictEqual(zeroReceipt.amountMYZ, 0);
    console.log('  ✅ 8. Zero Reward: Unverified claims produce 0 MYZ payout');

    console.log('🎉 All Environmental Reward Policy tests passed with 100% success!');
}

runRewardTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
