/**
 * 🪐 Metaverse Bounty Engine Core
 * Resolves Issue #38 (P1)
 */
const crypto = require('crypto');

class MetaverseBountyEngine {
    constructor() {
        this.bounties = new Map();
        this.claims = new Map();
        this.disbursedReceipts = [];
        this.processedRewards = new Set();
    }

    // 1. Create & Publish Bounty
    createBounty(config) {
        if (!config || !config.bountyId) throw new Error('Missing bountyId');
        const bounty = {
            bountyId: config.bountyId,
            title: config.title || 'Metaverse Mission',
            issuer: config.issuer || 'SYSTEM',
            zoneId: config.zoneId || 'GLOBAL',
            proofType: config.proofType || 'SENSOR_DATA',
            rewards: {
                myz: config.rewards?.myz || 50,
                xp: config.rewards?.xp || 200,
                reputation: config.rewards?.reputation || 15
            },
            status: 'AVAILABLE',
            createdAt: new Date().toISOString()
        };
        this.bounties.set(bounty.bountyId, bounty);
        return bounty;
    }

    // 2. Claim Bounty
    claimBounty(bountyId, identityId) {
        const bounty = this.bounties.get(bountyId);
        if (!bounty) throw new Error(`Bounty ${bountyId} not found`);
        if (bounty.status !== 'AVAILABLE') throw new Error(`Bounty status is ${bounty.status}, cannot claim`);

        const claimKey = `${bountyId}_${identityId}`;
        if (this.claims.has(claimKey)) {
            throw new Error(`Identity ${identityId} has already claimed bounty ${bountyId}`);
        }

        const claim = {
            claimId: `CLM_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`,
            bountyId,
            identityId,
            status: 'IN_PROGRESS',
            claimedAt: new Date().toISOString()
        };

        this.claims.set(claimKey, claim);
        return claim;
    }

    // 3. Submit Proof
    submitProof(bountyId, identityId, proofData) {
        const claimKey = `${bountyId}_${identityId}`;
        const claim = this.claims.get(claimKey);
        if (!claim) throw new Error(`Claim record not found for ${claimKey}`);

        claim.status = 'SUBMITTED';
        claim.proofData = proofData;
        claim.submittedAt = new Date().toISOString();
        return claim;
    }

    // 4. Validate & Disburse MYZ Reward
    validateAndReward(bountyId, identityId, validatorId) {
        const claimKey = `${bountyId}_${identityId}`;
        const claim = this.claims.get(claimKey);
        if (!claim) throw new Error(`Claim not found`);
        if (claim.status !== 'SUBMITTED') throw new Error(`Cannot reward claim in status ${claim.status}`);

        // Prevent Double-Reward / Replay Attack
        if (this.processedRewards.has(claimKey)) {
            throw new Error(`Reward already disbursed for ${claimKey}`);
        }

        const bounty = this.bounties.get(bountyId);
        const receipt = {
            receiptId: `RCP_ENG_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            bountyId,
            identityId,
            validatorId,
            amountMYZ: bounty.rewards.myz,
            amountXP: bounty.rewards.xp,
            amountReputation: bounty.rewards.reputation,
            status: 'REWARDED',
            disbursedAt: new Date().toISOString()
        };

        const signature = crypto.createHash('sha256').update(JSON.stringify(receipt)).digest('hex');
        receipt.signature = signature;

        claim.status = 'REWARDED';
        claim.receipt = receipt;

        this.processedRewards.add(claimKey);
        this.disbursedReceipts.push(receipt);

        return receipt;
    }
}

module.exports = MetaverseBountyEngine;
