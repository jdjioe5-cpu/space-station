const assert = require('assert');
const CharacterBountySystem = require('../bounties/character_bounty_system');

async function runBountySystemTests() {
    console.log('🧪 Starting MYZ Character Bounty System Tests...');

    const system = new CharacterBountySystem(10000);

    // 1. Check Initial Bounty List
    const bounties = system.listBounties();
    assert.strictEqual(bounties.length, 5);
    console.log('  ✅ 1. 5 Interactive character creation bounties initialized');

    // 2. Claim Bounty (ELIGIBLE -> CLAIMED)
    const { isReentrant, claim } = system.claimBounty('PIONEER_KATE', 'character_created', 'IDEMP_CLM_001');
    assert.strictEqual(isReentrant, false);
    assert.strictEqual(claim.stage, 'CLAIMED');
    assert.strictEqual(claim.rewardMYZ, 25);
    console.log(`  ✅ 2. Bounty claimed [${claim.claimId}]: Stage = CLAIMED`);

    // 3. Idempotency Check
    const reentrantRes = system.claimBounty('PIONEER_KATE', 'character_created', 'IDEMP_CLM_001');
    assert.strictEqual(reentrantRes.isReentrant, true);
    assert.strictEqual(reentrantRes.claim.claimId, claim.claimId);
    console.log('  ✅ 3. Idempotency key verified: Re-entrant request safely returned active claim');

    // 4. Validate Claim (CLAIMED -> VALIDATED)
    const validated = system.validateClaim(claim.claimId, { avatarMeshVerified: true });
    assert.strictEqual(validated.stage, 'VALIDATED');
    console.log('  ✅ 4. Telemetry verified: Stage transitioned to VALIDATED');

    // 5. Disburse Reward (VALIDATED -> APPROVED -> REWARDED)
    const rewarded = system.disburseReward(claim.claimId, 'ARBITER_CHIEF');
    assert.strictEqual(rewarded.stage, 'REWARDED');
    assert.strictEqual(rewarded.receiptSignature.length, 64);
    assert.strictEqual(system.treasuryBudgetMYZ, 9975); // 10000 - 25
    console.log(`  ✅ 5. Reward disbursed: 25 MYZ paid, SHA-256 signature generated [${rewarded.receiptSignature.substring(0, 16)}...]`);

    // 6. Anti-Duplicate Lock: Block second claim of same bounty
    assert.throws(() => {
        system.claimBounty('PIONEER_KATE', 'character_created', 'IDEMP_CLM_002');
    }, /Duplicate bounty claim blocked/);
    console.log('  ✅ 6. Duplicate claim blocked by tuple lock');

    // 7. Verify UI Dashboard HTML Output
    const html = system.renderDashboardHtml('PIONEER_KATE');
    assert(html.includes('MYZ INTERACTIVE CHARACTER BOUNTY BOARD'));
    assert(html.includes('status-rewarded'));
    console.log('  ✅ 7. Responsive Cyberpunk Bounty Board UI HTML rendered cleanly');

    console.log('🎉 All MYZ Character Bounty System tests passed 100%!');
}

runBountySystemTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
