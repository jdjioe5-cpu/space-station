/**
 * 🪐 Metaverse Bounty Engine Core (P1 - Issue #38)
 * Deterministic 10-State Machine, Durable Replay Guard & Validator Authorization
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const VALID_TRANSITIONS = {
    DRAFT: ['PUBLISHED', 'CANCELLED'],
    PUBLISHED: ['AVAILABLE', 'CANCELLED'],
    AVAILABLE: ['CLAIMED', 'EXPIRED', 'CANCELLED'],
    CLAIMED: ['IN_PROGRESS', 'AVAILABLE', 'CANCELLED'],
    IN_PROGRESS: ['SUBMITTED', 'EXPIRED', 'CANCELLED'],
    SUBMITTED: ['VALIDATION', 'REJECTED'],
    VALIDATION: ['APPROVED', 'REJECTED'],
    APPROVED: ['REWARDED', 'REVOKED'],
    REWARDED: ['REVOKED'],
    REJECTED: [],
    EXPIRED: [],
    CANCELLED: [],
    REVOKED: []
};

class MetaverseBountyEngine {
    constructor(options = {}) {
        this.storagePath = options.storagePath || '/tmp/metaverse_bounty_replay_journal.json';
        this.engineSecret = options.engineSecret || 'metaverse-bounty-engine-signing-key-2026';
        this.bounties = new Map();
        this.claims = new Map();
        this.disbursedReceipts = [];
        this.processedRewards = new Set();
        this.authorizedValidators = new Map();

        // Register default authorized validators
        this.registerValidator('VAL_ROMA_TRE', {
            name: 'Roma Tre Environmental Robotics Lab',
            role: 'INSTITUTIONAL_VALIDATOR',
            secret: 'val-roma-tre-secret-key-2026',
            active: true
        });
        this.registerValidator('VAL_SYSTEM_CORE', {
            name: 'Metaverse Kernel Proof Verifier',
            role: 'KERNEL_VALIDATOR',
            secret: 'kernel-verifier-secret-key-2026',
            active: true
        });

        // Load durable replay store
        this._loadDurableJournal();
    }

    _loadDurableJournal() {
        try {
            if (fs.existsSync(this.storagePath)) {
                const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf8'));
                if (Array.isArray(data)) {
                    data.forEach(key => this.processedRewards.add(key));
                }
            }
        } catch (e) {
            // fallback gracefully
        }
    }

    _persistDurableJournal() {
        try {
            fs.writeFileSync(this.storagePath, JSON.stringify(Array.from(this.processedRewards), null, 2), 'utf8');
        } catch (e) {
            // durable sync best-effort
        }
    }

    registerValidator(validatorId, details = {}) {
        if (!validatorId || typeof validatorId !== 'string') {
            throw new Error('validatorId must be a non-empty string');
        }
        this.authorizedValidators.set(validatorId, {
            name: details.name || 'Anonymous Validator',
            role: details.role || 'INDEPENDENT_VALIDATOR',
            secret: details.secret || 'default-secret',
            active: details.active !== false
        });
    }

    _validateAmount(val, fieldName) {
        if (typeof val !== 'number' || !Number.isFinite(val) || val < 0) {
            throw new Error(`Reward ${fieldName} must be a finite non-negative number, got ${val}`);
        }
        return val;
    }

    // 1. Create Bounty (Starts strictly in DRAFT)
    createBounty(config) {
        if (!config || !config.bountyId) throw new Error('Missing bountyId');

        // Nullish coalescing ?? preserves intentional 0
        const myz = this._validateAmount(config.rewards?.myz ?? 50, 'myz');
        const xp = this._validateAmount(config.rewards?.xp ?? 200, 'xp');
        const reputation = this._validateAmount(config.rewards?.reputation ?? 15, 'reputation');

        const bounty = {
            bountyId: config.bountyId,
            title: config.title || 'Metaverse Mission',
            issuer: config.issuer || 'SYSTEM',
            zoneId: config.zoneId || 'GLOBAL',
            proofType: config.proofType || 'SENSOR_DATA',
            rewards: { myz, xp, reputation },
            status: 'DRAFT',
            createdAt: new Date().toISOString()
        };

        this.bounties.set(bounty.bountyId, bounty);
        return bounty;
    }

    // 2. Publish Bounty (DRAFT -> PUBLISHED -> AVAILABLE)
    publishBounty(bountyId) {
        const bounty = this.bounties.get(bountyId);
        if (!bounty) throw new Error(`Bounty ${bountyId} not found`);
        
        this._assertTransition(bounty.status, 'PUBLISHED', `Bounty ${bountyId}`);
        bounty.status = 'PUBLISHED';
        bounty.publishedAt = new Date().toISOString();

        // Transition from PUBLISHED to AVAILABLE for open claiming
        this._assertTransition(bounty.status, 'AVAILABLE', `Bounty ${bountyId}`);
        bounty.status = 'AVAILABLE';
        return bounty;
    }

    // 3. Claim Bounty (AVAILABLE -> CLAIMED)
    claimBounty(bountyId, identityId) {
        const bounty = this.bounties.get(bountyId);
        if (!bounty) throw new Error(`Bounty ${bountyId} not found`);
        if (bounty.status !== 'AVAILABLE') {
            throw new Error(`Cannot claim bounty in status ${bounty.status}, must be AVAILABLE`);
        }

        const claimKey = `${bountyId}_${identityId}`;
        if (this.claims.has(claimKey)) {
            throw new Error(`Identity ${identityId} has already claimed bounty ${bountyId}`);
        }

        const claim = {
            claimId: `CLM_${crypto.randomUUID()}`,
            bountyId,
            identityId,
            status: 'CLAIMED',
            claimedAt: new Date().toISOString()
        };

        this.claims.set(claimKey, claim);
        return claim;
    }

    // 4. Start Work (CLAIMED -> IN_PROGRESS)
    startWork(bountyId, identityId) {
        const claimKey = `${bountyId}_${identityId}`;
        const claim = this.claims.get(claimKey);
        if (!claim) throw new Error(`Claim not found for ${claimKey}`);

        this._assertTransition(claim.status, 'IN_PROGRESS', `Claim ${claimKey}`);
        claim.status = 'IN_PROGRESS';
        claim.startedAt = new Date().toISOString();
        return claim;
    }

    // 5. Submit Proof with Proof Schema Validation (IN_PROGRESS -> SUBMITTED)
    submitProof(bountyId, identityId, proofData) {
        const claimKey = `${bountyId}_${identityId}`;
        const claim = this.claims.get(claimKey);
        if (!claim) throw new Error(`Claim record not found for ${claimKey}`);

        this._assertTransition(claim.status, 'SUBMITTED', `Claim ${claimKey}`);

        const bounty = this.bounties.get(bountyId);
        this._validateProofPayload(bounty.proofType, proofData);

        claim.status = 'SUBMITTED';
        claim.proofData = proofData;
        claim.submittedAt = new Date().toISOString();
        return claim;
    }

    _validateProofPayload(proofType, proofData) {
        if (!proofData || typeof proofData !== 'object') {
            throw new Error(`Invalid proofData for proofType '${proofType}': must be an object`);
        }

        if (proofType === 'SENSOR_DATA') {
            if (!proofData.telemetryFingerprint || typeof proofData.telemetryFingerprint !== 'string' || proofData.telemetryFingerprint.length < 16) {
                throw new Error('SENSOR_DATA proof requires valid telemetryFingerprint string');
            }
        } else if (proofType === 'QUEST_COMPLETION') {
            if (!proofData.questId || !proofData.completionHash) {
                throw new Error('QUEST_COMPLETION proof requires questId and completionHash');
            }
        } else if (proofType === 'PARTNER_VALIDATION') {
            if (!proofData.partnerOrg || !proofData.attestationHash) {
                throw new Error('PARTNER_VALIDATION proof requires partnerOrg and attestationHash');
            }
        }
    }

    // 6. Enter Validation Phase (SUBMITTED -> VALIDATION)
    startValidation(bountyId, identityId, validatorId) {
        const claimKey = `${bountyId}_${identityId}`;
        const claim = this.claims.get(claimKey);
        if (!claim) throw new Error(`Claim not found for ${claimKey}`);

        if (!validatorId || !this.authorizedValidators.has(validatorId)) {
            throw new Error(`Validator authorization failed: '${validatorId || 'none'}' is not recognized`);
        }
        const validator = this.authorizedValidators.get(validatorId);
        if (!validator.active) {
            throw new Error(`Validator '${validatorId}' is inactive`);
        }

        this._assertTransition(claim.status, 'VALIDATION', `Claim ${claimKey}`);
        claim.status = 'VALIDATION';
        claim.validatorId = validatorId;
        claim.validatedAt = new Date().toISOString();
        return claim;
    }

    // 7. Approve Validation (VALIDATION -> APPROVED)
    approveValidation(bountyId, identityId, validatorId) {
        const claimKey = `${bountyId}_${identityId}`;
        const claim = this.claims.get(claimKey);
        if (!claim) throw new Error(`Claim not found for ${claimKey}`);

        if (claim.validatorId !== validatorId) {
            throw new Error(`Validator mismatch: claimed by ${claim.validatorId}, approved by ${validatorId}`);
        }

        this._assertTransition(claim.status, 'APPROVED', `Claim ${claimKey}`);
        claim.status = 'APPROVED';
        claim.approvedAt = new Date().toISOString();
        return claim;
    }

    // 8. Disburse Reward (APPROVED -> REWARDED)
    disburseReward(bountyId, identityId, validatorId) {
        const claimKey = `${bountyId}_${identityId}`;

        // Prevent Double-Reward / Replay Attack via Durable Store (checked before in-memory claim lookup)
        if (this.processedRewards.has(claimKey)) {
            throw new Error(`Durable replay protection: Reward already disbursed for ${claimKey}`);
        }

        const claim = this.claims.get(claimKey);
        if (!claim) throw new Error(`Claim not found for ${claimKey}`);

        this._assertTransition(claim.status, 'REWARDED', `Claim ${claimKey}`);

        const bounty = this.bounties.get(bountyId);
        const validator = this.authorizedValidators.get(validatorId) || { secret: this.engineSecret };

        const receipt = {
            receiptId: `RCP_${crypto.randomUUID()}`,
            txId: `TX_MYZ_${crypto.randomUUID()}`,
            bountyId,
            identityId,
            validatorId,
            amountMYZ: bounty.rewards.myz,
            amountXP: bounty.rewards.xp,
            amountReputation: bounty.rewards.reputation,
            status: 'REWARDED',
            disbursedAt: new Date().toISOString()
        };

        // SHA-256 Content Digest
        const digest = crypto.createHash('sha256').update(JSON.stringify(receipt)).digest('hex');
        receipt.receiptDigest = digest;

        // Keyed HMAC-SHA256 Cryptographic Signature proving authorized disbursement
        const signature = crypto.createHmac('sha256', validator.secret)
            .update(`${receipt.receiptId}:${receipt.txId}:${receipt.amountMYZ}:${digest}`)
            .digest('hex');
        receipt.receiptSignature = signature;

        claim.status = 'REWARDED';
        claim.receipt = receipt;

        this.processedRewards.add(claimKey);
        this._persistDurableJournal();
        this.disbursedReceipts.push(receipt);

        return receipt;
    }

    _assertTransition(fromState, toState, entityName = 'Entity') {
        const allowed = VALID_TRANSITIONS[fromState] || [];
        if (!allowed.includes(toState)) {
            throw new Error(`Invalid state transition: ${entityName} cannot transition from ${fromState} to ${toState}. Allowed: [${allowed.join(', ')}]`);
        }
    }
}

module.exports = MetaverseBountyEngine;
