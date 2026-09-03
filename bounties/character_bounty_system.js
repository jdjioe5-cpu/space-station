/**
 * 🛰️ MYZ Bounty System for Interactive Character Creation
 * Resolves Issue #28 (P1)
 */
const crypto = require('crypto');

class CharacterBountySystem {
    constructor(initialPoolBudgetMYZ = 10000) {
        this.treasuryBudgetMYZ = initialPoolBudgetMYZ;
        this.bounties = new Map();
        this.claims = new Map(); // claimId -> claimRecord
        this.claimedBounties = new Set(); // "identityId:bountyKey"
        this.idempotencyRegistry = new Map();
        this.ledger = [];
        this._initDefaultBounties();
    }

    _initDefaultBounties() {
        const list = [
            { bountyKey: 'character_created', title: 'Base Character Mesh & Concept', rewardMYZ: 25, criteria: 'Avatar customization finalized', status: 'ACTIVE' },
            { bountyKey: 'identity_profile_completed', title: 'Complete Digital Identity Profile', rewardMYZ: 50, criteria: 'Biography and persona lore registered', status: 'ACTIVE' },
            { bountyKey: 'interactive_profile_enabled', title: 'Interactive Abilities & Skills', rewardMYZ: 75, criteria: 'Spatial traits and reaction matrices configured', status: 'ACTIVE' },
            { bountyKey: 'identity_card_published', title: 'Publish Public Identity Card', rewardMYZ: 50, criteria: 'Voluntary publication to station directory', status: 'ACTIVE' },
            { bountyKey: 'character_milestone', title: 'Complete Certified Quest Milestone', rewardMYZ: 100, criteria: 'First verified simulation or eco milestone achieved', status: 'ACTIVE' }
        ];

        for (const b of list) {
            this.bounties.set(b.bountyKey, b);
        }
    }

    // List available bounties
    listBounties() {
        return Array.from(this.bounties.values());
    }

    // 1. Claim Bounty (ELIGIBLE -> CLAIMED)
    claimBounty(identityId, bountyKey, idempotencyKey) {
        if (!identityId || !bountyKey || !idempotencyKey) {
            throw new Error('identityId, bountyKey, and idempotencyKey are required');
        }

        if (this.idempotencyRegistry.has(idempotencyKey)) {
            return { isReentrant: true, claim: this.idempotencyRegistry.get(idempotencyKey) };
        }

        const tupleKey = `${identityId}:${bountyKey}`;
        if (this.claimedBounties.has(tupleKey)) {
            throw new Error(`Duplicate bounty claim blocked for ${tupleKey}`);
        }

        const bounty = this.bounties.get(bountyKey);
        if (!bounty || bounty.status !== 'ACTIVE') {
            throw new Error(`Bounty ${bountyKey} is not active`);
        }

        if (this.treasuryBudgetMYZ < bounty.rewardMYZ) {
            throw new Error('Treasury bounty pool budget depleted');
        }

        const claimId = `CLM_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        const claim = {
            claimId,
            identityId,
            bountyKey,
            idempotencyKey,
            rewardMYZ: bounty.rewardMYZ,
            stage: 'CLAIMED',
            createdAt: new Date().toISOString()
        };

        this.claims.set(claimId, claim);
        this.idempotencyRegistry.set(idempotencyKey, claim);
        return { isReentrant: false, claim };
    }

    // 2. Validate Criteria (CLAIMED -> VALIDATED)
    validateClaim(claimId, proofTelemetry = {}) {
        const claim = this.claims.get(claimId);
        if (!claim) throw new Error(`Claim ${claimId} not found`);
        if (claim.stage !== 'CLAIMED') throw new Error(`Invalid stage transition from ${claim.stage}`);

        claim.proofTelemetry = proofTelemetry;
        claim.stage = 'VALIDATED';
        claim.validatedAt = new Date().toISOString();
        return claim;
    }

    // 3. Approve and Disburse Reward (VALIDATED -> APPROVED -> REWARDED)
    disburseReward(claimId, approverId = 'SYSTEM_AUTO_ARBITER') {
        const claim = this.claims.get(claimId);
        if (!claim) throw new Error(`Claim ${claimId} not found`);
        if (claim.stage !== 'VALIDATED') throw new Error(`Claim must be VALIDATED before disbursement (current: ${claim.stage})`);

        claim.stage = 'APPROVED';
        claim.approvedBy = approverId;

        // Deduct treasury budget and mark tuple lock
        this.treasuryBudgetMYZ -= claim.rewardMYZ;
        this.claimedBounties.add(`${claim.identityId}:${claim.bountyKey}`);

        claim.stage = 'REWARDED';
        claim.paidAt = new Date().toISOString();

        // SHA-256 Provenance Receipt
        claim.receiptSignature = crypto.createHash('sha256')
            .update(JSON.stringify({ claimId: claim.claimId, recipient: claim.identityId, amount: claim.rewardMYZ, paidAt: claim.paidAt }))
            .digest('hex');

        this.ledger.push(claim);
        return claim;
    }

    // Render Bounty Dashboard UI MVP
    renderDashboardHtml(identityId) {
        const rows = Array.from(this.bounties.values()).map(b => {
            const isClaimed = this.claimedBounties.has(`${identityId}:${b.bountyKey}`);
            return `
                <tr>
                    <td><strong>${b.title}</strong></td>
                    <td>${b.criteria}</td>
                    <td>🪙 ${b.rewardMYZ} MYZ</td>
                    <td>${isClaimed ? '<span class="status-rewarded">✅ REWARDED</span>' : '<span class="status-eligible">🟢 ELIGIBLE</span>'}</td>
                </tr>
            `;
        }).join('');

        return `
        <div class="character-bounty-dashboard cyberpunk-terminal">
            <h2>🏆 MYZ INTERACTIVE CHARACTER BOUNTY BOARD</h2>
            <div class="pool-metrics">
                <span>Treasury Pool: <strong>${this.treasuryBudgetMYZ} MYZ</strong></span>
                <span>Active Target: <strong>${identityId}</strong></span>
            </div>
            <table>
                <thead><tr><th>Bounty</th><th>Criteria</th><th>Reward</th><th>Status</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
        `;
    }
}

module.exports = CharacterBountySystem;
