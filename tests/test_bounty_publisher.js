const assert = require('assert');
const MetaverseBountyPublisher = require('../bounty/metaverse_bounty_publisher');

async function runPublisherTests() {
    console.log('🧪 Starting Metaverse Bounty Publisher Tests...');

    const publisher = new MetaverseBountyPublisher();

    // 1. Register LIFE Pilot Partner Issuer
    const partner = publisher.registerIssuer('PARTNER_ORTO_ROMA', 'LIFE_PILOT_PARTNER', {
        organization: 'Orto Botanico Roma Consortium',
        initialMYZ: 500
    });
    assert.strictEqual(partner.role, 'LIFE_PILOT_PARTNER');
    assert.strictEqual(partner.availableMYZ, 500);
    console.log('  ✅ 1. LIFE Pilot Partner issuer registered with 500 MYZ balance');

    // 2. Publish Bounty with Escrowed Budget Reservation
    const bounty = publisher.publishBounty('PARTNER_ORTO_ROMA', {
        title: 'High Canopy Microclimate Audit',
        totalBudgetMYZ: 200,
        rewardPerClaimMYZ: 50,
        requiredEvidenceLevel: 'PARTNER_VALIDATED',
        assignedValidator: 'VAL_ROMA_TRE'
    });
    assert.strictEqual(bounty.status, 'PUBLISHED');
    assert.strictEqual(bounty.maxClaims, 4);
    assert.strictEqual(partner.availableMYZ, 300); // 500 - 200 = 300
    assert(bounty.provenanceHash.length > 0);
    console.log(`  ✅ 2. Bounty published with 200 MYZ escrowed (hash=${bounty.provenanceHash})`);

    // 3. Test Insufficient Balance Rejection
    assert.throws(() => {
        publisher.publishBounty('PARTNER_ORTO_ROMA', { totalBudgetMYZ: 1000 });
    }, /Insufficient MYZ balance/);
    console.log('  ✅ 3. Excessive budget publication blocked by balance guard');

    // 4. Cancel Bounty and Verify Escrow Refund
    const cancelRes = publisher.cancelBounty(bounty.bountyId, 'PARTNER_ORTO_ROMA');
    assert.strictEqual(cancelRes.status, 'CANCELLED_REFUNDED');
    assert.strictEqual(cancelRes.refundedMYZ, 200);
    assert.strictEqual(cancelRes.updatedIssuerBalance, 500);
    console.log('  ✅ 4. Bounty cancelled and 200 MYZ successfully refunded to issuer balance');

    console.log('🎉 All Metaverse Bounty Publisher tests passed 100%!');
}

runPublisherTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
