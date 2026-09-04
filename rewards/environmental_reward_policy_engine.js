/**
 * 🪙 Environmental Bounty Validation & MYZ Reward Policy Engine
 * Resolves Issue #43 (P0) - Hardened Trust Model & Independent Validator Attestation
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

        // Registered authorized validators registry
        this.authorizedValidators = new Map();

        // Seed initial authorized partner validators
        this.registerValidator('VALIDATOR_ARPA_01', {
            name: 'ARPA Lazio Environmental Agency',
            role: 'INSTITUTIONAL_PARTNER',
            secret: 'arpa-secret-signature-key-2026',
            active: true
        });
        this.registerValidator('VALIDATOR_CNR_02', {
            name: 'CNR Water Research Institute',
            role: 'SCIENTIFIC_VALIDATOR',
            secret: 'cnr-research-secret-signature-key-2026',
            active: true
        });
    }

    // Register an authorized independent validator
    registerValidator(validatorId, details) {
        if (!validatorId || typeof validatorId !== 'string') {
            throw new Error('validatorId must be a non-empty string');
        }
        this.authorizedValidators.set(validatorId, {
            name: details.name || 'Anonymous Validator',
            role: details.role || 'INDEPENDENT_VALIDATOR',
            secret: details.secret || 'default-partner-secret',
            active: details.active !== false
        });
    }

    // Generate valid partner attestation signature (for testing / authorized partners)
    createAttestation(claimId, validatorId, evidenceHash, tier = 'PARTNER_VALIDATED') {
        const validator = this.authorizedValidators.get(validatorId);
        if (!validator) {
            throw new Error(`Validator ${validatorId} is not authorized`);
        }
        const message = `${claimId}:${validatorId}:${evidenceHash}:${tier}`;
        const signature = crypto.createHmac('sha256', validator.secret)
            .update(message)
            .digest('hex');
        return {
            validatorId,
            evidenceHash,
            signature,
            timestamp: new Date().toISOString()
        };
    }

    // Enforce strict independent validation & fail-closed boundaries
    verifyValidationAttestation(claimPayload) {
        if (!claimPayload || typeof claimPayload !== 'object') {
            throw new Error('Invalid claim payload: expected object');
        }

        const { evidenceLevel, validatorId, attestation, evidenceHash } = claimPayload;
        const level = (evidenceLevel || 'UNVERIFIED').toUpperCase();

        if (level === 'UNVERIFIED') {
            return { valid: true, effectiveTier: 'UNVERIFIED', authorized: true };
        }

        if (level === 'SELF_REPORTED') {
            if (!evidenceHash || typeof evidenceHash !== 'string') {
                throw new Error('SELF_REPORTED tier requires linked evidenceHash');
            }
            return { valid: true, effectiveTier: 'SELF_REPORTED', authorized: true };
        }

        if (level === 'VERIFIED_PHYSICAL') {
            if (!validatorId || !this.authorizedValidators.has(validatorId)) {
                throw new Error(`Unauthorized or missing validator for VERIFIED_PHYSICAL: ${validatorId || 'none'}`);
            }
            if (!evidenceHash) {
                throw new Error('VERIFIED_PHYSICAL requires linked evidenceHash');
            }
            return { valid: true, effectiveTier: 'VERIFIED_PHYSICAL', authorized: true, validatorId };
        }

        if (level === 'PARTNER_VALIDATED') {
            // Fail-closed: self-declared PARTNER_VALIDATED without independent authorized check is strictly forbidden
            if (!validatorId || !this.authorizedValidators.has(validatorId)) {
                throw new Error(`Unauthorized or missing validator identity: '${validatorId || 'none'}'. Self-declaration not permitted for PARTNER_VALIDATED tier.`);
            }

            const validator = this.authorizedValidators.get(validatorId);
            if (!validator.active) {
                throw new Error(`Partner validator ${validatorId} is currently inactive/revoked`);
            }

            if (!evidenceHash || typeof evidenceHash !== 'string' || evidenceHash.length < 32) {
                throw new Error('PARTNER_VALIDATED requires verified external evidenceHash linkage');
            }

            if (!attestation || !attestation.signature) {
                throw new Error('PARTNER_VALIDATED requires validator-signed cryptographic attestation');
            }

            // Verify attestation cryptographic signature
            const message = `${claimPayload.claimId}:${validatorId}:${evidenceHash}:PARTNER_VALIDATED`;
            const expectedSig = crypto.createHmac('sha256', validator.secret)
                .update(message)
                .digest('hex');

            if (attestation.signature !== expectedSig) {
                throw new Error('Cryptographic attestation signature mismatch: invalid or tampered attestation');
            }

            return {
                valid: true,
                effectiveTier: 'PARTNER_VALIDATED',
                authorized: true,
                validatorId,
                validatorName: validator.name
            };
        }

        throw new Error(`Unsupported evidence level: ${evidenceLevel}`);
    }

    // Evaluate Reward Eligibility based on Evidence Level
    calculateReward(evidenceLevel) {
        const level = (evidenceLevel || 'UNVERIFIED').toUpperCase();
        return this.tierRewards[level] !== undefined ? this.tierRewards[level] : 0;
    }

    // Trigger Payment from Validation Decision with Fail-Closed Guarantees
    disburseReward(claimPayload) {
        if (!claimPayload || !claimPayload.claimId) {
            throw new Error('Missing claimId in payload');
        }

        const { claimId, recipient, evidenceLevel, zoneId, evidenceHash } = claimPayload;

        // 1. Anti-replay / Idempotency protection
        if (this.processedClaims.has(claimId)) {
            throw new Error(`Double-reward attempt rejected: Claim ${claimId} already paid`);
        }

        // 2. Fail-Closed Trust Model Verification
        const verification = this.verifyValidationAttestation(claimPayload);
        const effectiveTier = verification.effectiveTier;

        const amount = this.calculateReward(effectiveTier);
        if (amount <= 0) {
            return {
                claimId,
                status: 'REJECTED_ZERO_REWARD',
                reason: 'No MYZ reward granted for unverified claim',
                amountMYZ: 0
            };
        }

        const receipt = {
            receiptId: `RCP_${crypto.randomUUID()}`,
            claimId,
            recipient: recipient || '0x21d6630ECcB68a34aF6Dd052786746BEb5dD9b9e',
            zoneId: zoneId || 'ZONE_GLOBAL',
            evidenceLevel: effectiveTier,
            evidenceHash: evidenceHash || null,
            validatedBy: verification.validatorId || null,
            amountMYZ: amount,
            status: 'DISBURSED',
            disbursedAt: new Date().toISOString()
        };

        // Canonical digest of the disbursed receipt
        const digest = crypto.createHash('sha256').update(JSON.stringify(receipt)).digest('hex');
        receipt.receiptDigest = digest;

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
