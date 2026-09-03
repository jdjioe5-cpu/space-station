const assert = require('assert');
const IdentityCardRenderer = require('../identity/identity_card_renderer');

async function runCardTests() {
    console.log('🧪 Starting Identity Card Renderer Tests...');

    const renderer = new IdentityCardRenderer();

    // 1. Build Human Verified Identity Card
    const card1 = renderer.buildCardModel({
        identityId: 'ID_ALICE_9923847291847192847',
        displayName: 'Alice Vance',
        handle: 'alice_vance',
        archetypeSpecies: 'Station Biologist',
        isSimulatedEntity: false,
        verificationStatus: 'SYSTEM_VERIFIED',
        walletAddress: '0xSECRET_WALLET_ADDRESS', // Should be omitted
        internalCoordinates: { x: 10, y: 20 }     // Should be omitted
    });

    assert.strictEqual(card1.entityType, 'HUMAN');
    assert.strictEqual(card1.verificationBadge, 'VERIFIED');
    assert.strictEqual(card1.abbreviatedId, 'ID_ALI...7192847'.substring(0, 14));
    assert(!('walletAddress' in card1));
    assert(!('internalCoordinates' in card1));
    console.log('  ✅ 1. Human verified card model constructed with privacy masking');

    // 2. Build Simulated Unverified Entity Card
    const card2 = renderer.buildCardModel({
        identityId: 'ID_ZORGAX_ALIEN_AI',
        displayName: 'Zorgax The Synthetic',
        archetypeSpecies: 'Xenomorphic AI',
        isSimulatedEntity: true,
        verificationStatus: 'SELF_DECLARED'
    });

    assert.strictEqual(card2.entityType, 'SIMULATED');
    assert.strictEqual(card2.verificationBadge, 'UNVERIFIED');
    console.log('  ✅ 2. Simulated unverified entity card properly categorized');

    // 3. Deep Link & Native Protocol Verification
    assert(card1.deepLink.startsWith('https://spacestation.myzubster.io/id/'));
    assert(card1.nativeProtocolLink.startsWith('myz://identity/'));
    console.log(`  ✅ 3. Deep link verified: ${card1.deepLink}`);

    // 4. SVG Image Export
    const svg = renderer.exportCardSvg(card1);
    assert(svg.includes('<svg'));
    assert(svg.includes('Alice Vance'));
    assert(svg.includes('VERIFIED'));
    console.log('  ✅ 4. Vector SVG card image exported successfully');

    // 5. HTML Component Rendering
    const html = renderer.renderCardHtml(card1);
    assert(html.includes('myz-identity-card'));
    assert(html.includes('badge-entity human'));
    console.log('  ✅ 5. Responsive HTML card component rendered cleanly');

    console.log('🎉 All Identity Card Renderer tests passed 100%!');
}

runCardTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
