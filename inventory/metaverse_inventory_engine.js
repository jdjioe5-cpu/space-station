/**
 * 🎒 Metaverse Inventory & Wearables Engine
 * Resolves Issue #34 (P2)
 */
const crypto = require('crypto');

class MetaverseInventoryEngine {
    constructor() {
        this.inventories = new Map(); // identityId -> Map(itemId -> item)
        this.equipped = new Map();   // identityId -> Map(slot -> itemId)
    }

    _getOrCreateInventory(identityId) {
        if (!this.inventories.has(identityId)) {
            this.inventories.set(identityId, new Map());
            this.equipped.set(identityId, new Map());
        }
        return {
            items: this.inventories.get(identityId),
            equipped: this.equipped.get(identityId)
        };
    }

    // 1. Add Item with Provenance Tracking
    addItem(identityId, payload) {
        const { items } = this._getOrCreateInventory(identityId);
        const itemId = payload.itemId || `ITEM_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`;

        const item = {
            itemId,
            name: payload.name || 'Station Object',
            category: payload.category || 'WEARABLE',
            slot: payload.slot || 'HEAD',
            rarity: payload.rarity || 'COMMON',
            isTransferable: payload.isTransferable !== undefined ? payload.isTransferable : true,
            source: payload.source || 'STATION_REWARD',
            acquiredAt: new Date().toISOString()
        };

        // Provenance hash computation
        item.provenanceHash = crypto.createHash('sha256')
            .update(`${identityId}:${itemId}:${item.source}:${item.acquiredAt}`)
            .digest('hex');

        items.set(itemId, item);
        return item;
    }

    // 2. Equip Item
    equipItem(identityId, itemId) {
        const { items, equipped } = this._getOrCreateInventory(identityId);
        const item = items.get(itemId);
        if (!item) throw new Error(`Item ${itemId} not found in inventory`);

        // Equip to slot
        equipped.set(item.slot, itemId);
        return { identityId, equippedSlot: item.slot, itemId };
    }

    // 3. Unequip Item
    unequipItem(identityId, slot) {
        const { equipped } = this._getOrCreateInventory(identityId);
        if (!equipped.has(slot)) return { unequipped: false };
        const removed = equipped.get(slot);
        equipped.delete(slot);
        return { identityId, unequippedSlot: slot, removedItemId: removed };
    }

    // 4. Transfer Item (Respecting Soulbound Non-Transferable Rule)
    transferItem(fromId, toId, itemId) {
        const fromInv = this._getOrCreateInventory(fromId);
        const toInv = this._getOrCreateInventory(toId);

        const item = fromInv.items.get(itemId);
        if (!item) throw new Error(`Item ${itemId} not found in sender inventory`);
        if (!item.isTransferable) {
            throw new Error(`Item ${item.name} is Soulbound and non-transferable`);
        }

        // Unequip if currently worn
        if (fromInv.equipped.get(item.slot) === itemId) {
            fromInv.equipped.delete(item.slot);
        }

        fromInv.items.delete(itemId);
        toInv.items.set(itemId, item);

        return { fromId, toId, itemId, transferred: true };
    }

    // 5. Render Inventory HTML
    renderInventoryHtml(identityId) {
        const { items, equipped } = this._getOrCreateInventory(identityId);
        const itemList = Array.from(items.values()).map(i => {
            const isEquipped = equipped.get(i.slot) === i.itemId;
            return `
                <li class="item-card ${isEquipped ? 'equipped' : ''}">
                    <strong>${i.name}</strong> [${i.rarity}] (${i.slot})
                    <span>${isEquipped ? '★ EQUIPPED' : 'UNMOUNTED'}</span>
                    ${!i.isTransferable ? '<span class="soulbound-tag">SOULBOUND</span>' : ''}
                </li>
            `;
        }).join('');

        return `
        <div class="terminal-inventory">
            <h4>🛰️ STATION CARGO MANIFEST [${identityId}]</h4>
            <ul>${itemList}</ul>
        </div>
        `;
    }
}

module.exports = MetaverseInventoryEngine;
