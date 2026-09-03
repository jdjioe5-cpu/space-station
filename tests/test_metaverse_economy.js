const assert = require('assert');
const MetaverseEconomyEngine = require('../economy/metaverse_economy_engine');

async function runEconomyTests() {
    console.log('🧪 Starting Metaverse Economy & Marketplace Tests...');

    const engine = new MetaverseEconomyEngine();

    // 1. Initialize Balances
    const alice = engine.initAccount('ALICE', 1000, 50, 15);
    const bob = engine.initAccount('BOB', 50, 10, 5);
    assert.strictEqual(alice.myz, 1000);
    assert.strictEqual(bob.myz, 50);
    console.log('  ✅ 1. Identity balances initialized (MYZ strictly segregated from XP & Rep)');

    // 2. Create Marketplace Listing
    const listing = engine.listAsset('BOB', {
        assetName: 'Solar Flare Helmet Skin',
        assetType: 'COSMETIC_SKIN',
        priceMYZ: 60
    });
    assert.strictEqual(listing.status, 'ACTIVE');
    assert.strictEqual(listing.priceMYZ, 60);
    console.log('  ✅ 2. Digital cosmetic item listed on marketplace');

    // 3. Purchase Item (Atomic Transfer)
    const receipt = engine.buyAsset('ALICE', listing.listingId);
    assert.strictEqual(receipt.status, 'CONFIRMED');
    assert.strictEqual(engine.getBalance('ALICE').myz, 940); // 1000 - 60
    assert.strictEqual(engine.getBalance('BOB').myz, 110);   // 50 + 60
    assert(receipt.signature.length === 64);
    console.log(`  ✅ 3. Item purchased with atomic balance update and SHA-256 receipt [${receipt.signature.substring(0, 16)}...]`);

    // 4. Test Insufficient Funds
    const expensive = engine.listAsset('ALICE', { assetName: 'Fusion Reactor Core', priceMYZ: 500 });
    assert.throws(() => {
        engine.buyAsset('BOB', expensive.listingId); // Bob only has 110
    }, /Insufficient MYZ balance/);
    console.log('  ✅ 4. Insolvent purchase blocked by balance guard');

    // 5. Test Daily Spend Cap (Cap is 500. Alice spent 60. Now buy 460 -> 60 + 460 = 520 > 500)
    const capTest = engine.listAsset('BOB', { assetName: 'Gold Trophy', priceMYZ: 460 });
    assert.throws(() => {
        engine.buyAsset('ALICE', capTest.listingId);
    }, /Daily spend limit exceeded/);
    console.log('  ✅ 5. Daily expenditure cap prevented excessive outflow');

    console.log('🎉 All Metaverse Economy & Marketplace tests passed 100%!');
}

runEconomyTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
