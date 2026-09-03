/**
 * 🪙 Metaverse Economy & Marketplace Engine
 * Resolves Issue #35 (P2)
 */
const crypto = require('crypto');

class MetaverseEconomyEngine {
    constructor() {
        this.balances = new Map(); // identityId -> { myz: number, xp: number, reputation: number }
        this.dailySpend = new Map(); // identityId -> number
        this.dailySpendCap = 500; // max MYZ spend per identity per day
        this.listings = new Map(); // listingId -> item
        this.receipts = [];
    }

    // Set or initialize balance
    initAccount(identityId, initialMYZ = 100, xp = 0, reputation = 10) {
        const acc = { myz: initialMYZ, xp, reputation };
        this.balances.set(identityId, acc);
        this.dailySpend.set(identityId, 0);
        return acc;
    }

    getBalance(identityId) {
        return this.balances.get(identityId) || { myz: 0, xp: 0, reputation: 0 };
    }

    // 1. Create Marketplace Listing
    listAsset(sellerId, assetPayload) {
        const sellerAcc = this.getBalance(sellerId);
        const price = Number(assetPayload.priceMYZ || 25);
        if (price <= 0) throw new Error('Price must be greater than 0');

        const listingId = `LST_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`;
        const item = {
            listingId,
            sellerId,
            assetName: assetPayload.assetName || 'Cosmetic Hologram',
            assetType: assetPayload.assetType || 'COSMETIC_SKIN',
            priceMYZ: price,
            status: 'ACTIVE',
            createdAt: new Date().toISOString()
        };
        this.listings.set(listingId, item);
        return item;
    }

    // 2. Buy Marketplace Asset
    buyAsset(buyerId, listingId) {
        const item = this.listings.get(listingId);
        if (!item) throw new Error(`Listing ${listingId} not found`);
        if (item.status !== 'ACTIVE') throw new Error(`Listing is ${item.status}`);

        const buyerAcc = this.getBalance(buyerId);
        if (buyerAcc.myz < item.priceMYZ) {
            throw new Error(`Insufficient MYZ balance: required ${item.priceMYZ}, available ${buyerAcc.myz}`);
        }

        // Daily Spend Cap Guard
        const spentToday = this.dailySpend.get(buyerId) || 0;
        if (spentToday + item.priceMYZ > this.dailySpendCap) {
            throw new Error(`Daily spend limit exceeded: cap is ${this.dailySpendCap} MYZ`);
        }

        // Atomic Debit & Credit
        buyerAcc.myz -= item.priceMYZ;
        const sellerAcc = this.getBalance(item.sellerId);
        sellerAcc.myz += item.priceMYZ;
        this.dailySpend.set(buyerId, spentToday + item.priceMYZ);

        item.status = 'SOLD';
        item.buyerId = buyerId;

        // Cryptographic Receipt
        const receipt = {
            txId: `TX_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            listingId,
            buyerId,
            sellerId: item.sellerId,
            assetName: item.assetName,
            priceMYZ: item.priceMYZ,
            timestamp: new Date().toISOString(),
            status: 'CONFIRMED'
        };
        receipt.signature = crypto.createHash('sha256').update(JSON.stringify(receipt)).digest('hex');
        this.receipts.push(receipt);

        return receipt;
    }

    // 3. Render Marketplace UI MVP
    renderMarketplaceHtml() {
        const activeItems = Array.from(this.listings.values()).filter(i => i.status === 'ACTIVE');
        const cards = activeItems.map(i => `
            <div class="market-card">
                <h5>${i.assetName}</h5>
                <span class="type-badge">${i.assetType}</span>
                <p class="price-tag">🪙 ${i.priceMYZ} MYZ</p>
                <button onclick="buyItem('${i.listingId}')">PURCHASE</button>
            </div>
        `).join('');

        return `
        <div class="metaverse-market terminal-theme">
            <header><h3>🛰️ SPACE STATION CYBER MARKETPLACE</h3></header>
            <div class="items-grid">${cards}</div>
        </div>
        `;
    }
}

module.exports = MetaverseEconomyEngine;
