const assert = require('assert');
const MetaverseInventoryEngine = require('../inventory/metaverse_inventory_engine');

async function runInventoryTests() {
    console.log('🧪 Starting Metaverse Inventory Tests...');

    const engine = new MetaverseInventoryEngine();

    // 1. Add Wearable Item
    const helmet = engine.addItem('ASTRONAUT_ALICE', {
        name: 'Nebula Visor Mk-IV',
        category: 'WEARABLE',
        slot: 'HEAD',
        rarity: 'EPIC',
        isTransferable: true,
        source: 'LIFE_EXPEDITION'
    });
    assert.strictEqual(helmet.slot, 'HEAD');
    assert(helmet.provenanceHash.length === 64);
    console.log(`  ✅ 1. Wearable item created with SHA-256 provenance [${helmet.provenanceHash.substring(0, 16)}...]`);

    // 2. Equip Item to Avatar Slot
    const eq = engine.equipItem('ASTRONAUT_ALICE', helmet.itemId);
    assert.strictEqual(eq.equippedSlot, 'HEAD');
    console.log('  ✅ 2. Item successfully equipped to HEAD slot');

    // 3. Add Soulbound Achievement Badge
    const badge = engine.addItem('ASTRONAUT_ALICE', {
        name: 'Zero-Gravity Forest Pioneer Badge',
        category: 'BADGE',
        slot: 'BADGE',
        rarity: 'LEGENDARY',
        isTransferable: false,
        source: 'BOUNTY_COMPLETION_28'
    });
    assert.strictEqual(badge.isTransferable, false);
    console.log('  ✅ 3. Legendary achievement badge minted with soulbound flag');

    // 4. Test Soulbound Protection (Blocked Transfer)
    assert.throws(() => {
        engine.transferItem('ASTRONAUT_ALICE', 'ASTRONAUT_BOB', badge.itemId);
    }, /is Soulbound and non-transferable/);
    console.log('  ✅ 4. Soulbound protection blocked unauthorized transfer');

    // 5. Transfer Allowed Item
    const transfer = engine.transferItem('ASTRONAUT_ALICE', 'ASTRONAUT_BOB', helmet.itemId);
    assert.strictEqual(transfer.transferred, true);
    console.log('  ✅ 5. Transferable item successfully relocated to recipient inventory');

    // 6. Test Unequip
    const unequip = engine.unequipItem('ASTRONAUT_ALICE', 'HEAD');
    assert.strictEqual(unequip.unequipped, false); // Already auto-unequipped on transfer
    console.log('  ✅ 6. Auto-unequip on inventory exit confirmed');

    console.log('🎉 All Metaverse Inventory tests passed 100%!');
}

runInventoryTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
