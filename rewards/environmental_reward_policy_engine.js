/**
 * 🪙 Environmental Bounty Validation & MYZ Reward Policy Engine
 * Resolves Issue #43 (P0)
 */
const crypto = require('crypto');

class EnvironmentalRewardPolicyEngine {
    constructor() {
        this.rewardLedger = [];
        this.processedClaims = new Set();
        this.tierRewards = {
            UNVERIFIED: 0,
            SELF_REPORTED: 25,
            VERIFIED_PHYSICAL: 100,
            PARTNER_VALIDATED: 250
        };
    }

    // Evaluate Reward Eligibility based on Evidence Level
    calculateReward(evidenceLevel) {
        const level = (evidenceLevel || 'UNVERIFIED').toUpperCase();
        return this.tierRewards[level] !== undefined ? this.tierRewards[level] : 0;
    }

    // Trigger Payment from Validation Decision
    disburseReward(claimPayload) {
        if (!claimPayload || !claimPayload.claimId) {
            throw new Error('Missing claimId in payload');
        }

        const { claimId, recipient, evidenceLevel, zoneId } = claimPayload;

        // Anti-replay / Idempotency protection
        if (this.processedClaims.has(claimId)) {
            throw new Error(`Double-reward attempt rejected: Claim ${claimId} already paid`);
        }

        const amount = this.calculateReward(evidenceLevel);
        if (amount <= 0) {
            return {
                claimId,
                status: 'REJECTED_ZERO_REWARD',
                reason: 'No MYZ reward granted for unverified claim',
                amount: 0
            };
        }

        const receipt = {
            receiptId: `RCP_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            claimId,
            recipient: recipient || '0x21d6630ECcB68a34aF6Dd052786746BEb5dD9b9e',
            zoneId: zoneId || 'ZONE_GLOBAL',
            evidenceLevel,
            amountMYZ: amount,
            status: 'DISBURSED',
            disbursedAt: new Date().toISOString()
        };

        const signature = crypto.createHash('sha256').update(JSON.stringify(receipt)).digest('hex');
        receipt.receiptSignature = signature;

        this.processedClaims.add(claimId);
        this.rewardLedger.push(receipt);

        return receipt;
    }

    // Revoke or Correct a Disbursement
    revokeReward(claimId, reason = 'Evidence falsification') {
        const receipt = this.rewardLedger.find(r => r.claimId === claimId);
        if (!receipt) throw new Error(`Receipt for claim ${claimId} not found`);

        receipt.status = 'REVOKED';
        receipt.revocationReason = reason;
        receipt.revokedAt = new Date().toISOString();
        return receipt;
    }
}

module.exports = EnvironmentalRewardPolicyEngine;
