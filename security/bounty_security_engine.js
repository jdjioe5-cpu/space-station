/**
 * 🛡️ MYZ Bounty Security & Anti-Sybil Ledger Engine
 * Resolves Issue #30 (P1)
 */
const crypto = require('crypto');

class BountySecurityEngine {
    constructor() {
        this.claimedBounties = new Set(); // "identityId:bountyId"
        this.idempotencyRegistry = new Map(); // idempotencyKey -> rewardRecord
        this.claimTimestamps = new Map(); // identityId -> timestamp[]
        this.ledger = [];
        this.reviewThreshold = 70; // riskScore >= 70 routes to FLAGGED_MANUAL_REVIEW
        this.velocityCooldownSeconds = 10;
    }

    // Evaluate Risk Score (0-100) based on pseudonymous signals
    calculateRiskScore(identityId, bountyId, metadata = {}) {
        let score = 0;
        const now = Date.now();

        // Signal 1: Velocity Check (Claims within cooldown)
        const history = this.claimTimestamps.get(identityId) || [];
        const recent = history.filter(t => (now - t) < (this.velocityCooldownSeconds * 1000));
        if (recent.length >= 2) score += 45; // rapid burst farming

        // Signal 2: Account Age / Newcomer Flag
        if (metadata.isNewcomer) score += 20;

        // Signal 3: Unverified or Suspicious Proof Telemetry
        if (metadata.telemetryAnomaly) score += 30;

        return Math.min(score, 100);
    }

    // Process Reward Claim with Sybil & Replay Defenses
    processRewardClaim(claimRequest) {
        const { identityId, bountyId, idempotencyKey, amountMYZ, metadata = {} } = claimRequest;
        if (!identityId || !bountyId || !idempotencyKey) {
            throw new Error('identityId, bountyId, and idempotencyKey are strictly required');
        }

        // 1. Idempotency Check (Safe re-entrant response)
        if (this.idempotencyRegistry.has(idempotencyKey)) {
            return {
                isReentrant: true,
                record: this.idempotencyRegistry.get(idempotencyKey)
            };
        }

        // 2. Sybil Defense: One reward per identityId + bountyId
        const claimKey = `${identityId}:${bountyId}`;
        if (this.claimedBounties.has(claimKey)) {
            throw new Error(`Duplicate reward blocked: Identity ${identityId} already claimed bounty ${bountyId}`);
        }

        // 3. Evaluate Risk Score
        const riskScore = this.calculateRiskScore(identityId, bountyId, metadata);

        // 4. Determine State
        let state = 'PAID';
        if (riskScore >= this.reviewThreshold) {
            state = 'FLAGGED_MANUAL_REVIEW';
        }

        // 5. Update Velocity Tracking
        const history = this.claimTimestamps.get(identityId) || [];
        history.push(Date.now());
        this.claimTimestamps.set(identityId, history);

        // 6. Form Immutable Record & Signature
        const rewardId = `RWD_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const record = {
            rewardId,
            identityId,
            bountyId,
            idempotencyKey,
            amountMYZ: Number(amountMYZ || 0),
            riskScore,
            state,
            timestamp: new Date().toISOString()
        };

        record.signature = crypto.createHash('sha256')
            .update(JSON.stringify(record))
            .digest('hex');

        // Only commit to claimedBounties if approved or paid
        if (state === 'PAID') {
            this.claimedBounties.add(claimKey);
        }

        this.idempotencyRegistry.set(idempotencyKey, record);
        this.ledger.push(record);

        return { isReentrant: false, record };
    }

    // Manual Review Approval Path
    approveManualReview(rewardId, reviewerId) {
        const record = this.ledger.find(r => r.rewardId === rewardId);
        if (!record) throw new Error(`Reward ${rewardId} not found`);
        if (record.state !== 'FLAGGED_MANUAL_REVIEW') {
            throw new Error(`Cannot approve reward in state: ${record.state}`);
        }

        record.state = 'PAID';
        record.approvedBy = reviewerId;
        record.approvedAt = new Date().toISOString();
        this.claimedBounties.add(`${record.identityId}:${record.bountyId}`);

        return record;
    }
}

module.exports = BountySecurityEngine;
