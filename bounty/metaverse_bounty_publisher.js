/**
 * 📢 Metaverse Bounty Publisher Engine
 * Resolves Issue #40 (P2)
 */
const crypto = require('crypto');

class MetaverseBountyPublisher {
    constructor() {
        this.issuers = new Map();
        this.bounties = new Map();
        this.escrowBalance = new Map(); // issuerId -> locked MYZ
    }

    // 1. Register Authorized Issuer
    registerIssuer(issuerId, role, metadata = {}) {
        const allowedRoles = ['SYSTEM', 'VERIFIED_ENTITY', 'COMMUNITY_MODERATOR', 'APPROVED_PARTNER', 'LIFE_PILOT_PARTNER'];
        const validRole = role.toUpperCase();
        if (!allowedRoles.includes(validRole)) {
            throw new Error(`Invalid issuer role: ${role}`);
        }

        const issuer = {
            issuerId,
            role: validRole,
            organization: metadata.organization || 'Ecosystem Contributor',
            availableMYZ: metadata.initialMYZ || 1000,
            registeredAt: new Date().toISOString()
        };
        this.issuers.set(issuerId, issuer);
        this.escrowBalance.set(issuerId, 0);
        return issuer;
    }

    // 2. Create & Publish Bounty with Escrowed Budget Reservation
    publishBounty(issuerId, bountyConfig) {
        const issuer = this.issuers.get(issuerId);
        if (!issuer) throw new Error(`Issuer ${issuerId} not registered`);

        const totalBudget = Number(bountyConfig.totalBudgetMYZ || 100);
        const rewardPerClaim = Number(bountyConfig.rewardPerClaimMYZ || 25);
        const maxClaims = Math.floor(totalBudget / rewardPerClaim);

        if (issuer.availableMYZ < totalBudget) {
            throw new Error(`Insufficient MYZ balance: required ${totalBudget}, available ${issuer.availableMYZ}`);
        }

        // Lock Budget into Escrow
        issuer.availableMYZ -= totalBudget;
        this.escrowBalance.set(issuerId, this.escrowBalance.get(issuerId) + totalBudget);

        const bountyId = `BNT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const payloadToHash = {
            bountyId,
            issuerId,
            issuerRole: issuer.role,
            title: bountyConfig.title || 'Environmental Monitoring Mission',
            requiredEvidenceLevel: bountyConfig.requiredEvidenceLevel || 'SENSOR_BACKED',
            assignedValidator: bountyConfig.assignedValidator || 'VAL_ROMA_TRE',
            totalBudgetMYZ: totalBudget,
            rewardPerClaimMYZ: rewardPerClaim,
            maxClaims,
            claimedCount: 0,
            status: 'PUBLISHED',
            publishedAt: new Date().toISOString()
        };

        const provenanceHash = crypto.createHash('sha256').update(JSON.stringify(payloadToHash)).digest('hex').substring(0, 16);
        const bounty = {
            ...payloadToHash,
            provenanceHash
        };

        this.bounties.set(bountyId, bounty);
        return bounty;
    }

    // 3. Cancel Bounty and Refund Remaining Escrowed MYZ
    cancelBounty(bountyId, issuerId) {
        const bounty = this.bounties.get(bountyId);
        if (!bounty) throw new Error(`Bounty ${bountyId} not found`);
        if (bounty.issuerId !== issuerId) throw new Error(`Unauthorized: only issuer can cancel`);
        if (bounty.status !== 'PUBLISHED') throw new Error(`Cannot cancel bounty in status ${bounty.status}`);

        const remainingClaims = bounty.maxClaims - bounty.claimedCount;
        const refundAmount = remainingClaims * bounty.rewardPerClaimMYZ;

        const issuer = this.issuers.get(issuerId);
        issuer.availableMYZ += refundAmount;
        this.escrowBalance.set(issuerId, this.escrowBalance.get(issuerId) - refundAmount);

        bounty.status = 'CANCELLED_REFUNDED';
        bounty.refundedMYZ = refundAmount;
        bounty.closedAt = new Date().toISOString();

        return {
            bountyId,
            status: bounty.status,
            refundedMYZ: refundAmount,
            updatedIssuerBalance: issuer.availableMYZ
        };
    }
}

module.exports = MetaverseBountyPublisher;
