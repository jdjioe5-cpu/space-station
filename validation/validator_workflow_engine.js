/**
 * 🔬 Scientific & Partner Validation Workflow Engine
 * Resolves Issue #46 (P1)
 */
const crypto = require('crypto');

class ValidatorWorkflowEngine {
    constructor() {
        this.registeredValidators = new Map();
        this.reviewQueue = [];
        this.validationArchive = [];
    }

    // 1. Register Authorized Validator with Role
    registerValidator(validatorId, metadata = {}) {
        const allowedRoles = ['ACADEMIC_PARTNER', 'INDEPENDENT_AUDITOR', 'UTILITY_OPERATOR', 'COMMUNITY_LEAD'];
        const role = metadata.role || 'INDEPENDENT_AUDITOR';
        if (!allowedRoles.includes(role)) {
            throw new Error(`Invalid validator role: ${role}`);
        }

        const validator = {
            validatorId,
            organization: metadata.organization || 'Independent Scientific Node',
            role,
            publicKey: metadata.publicKey || crypto.randomBytes(16).toString('hex'),
            registeredAt: new Date().toISOString()
        };
        this.registeredValidators.set(validatorId, validator);
        return validator;
    }

    // 2. Submit Evidence Package to Review Queue
    submitPackageForReview(evidencePackage) {
        if (!evidencePackage || !evidencePackage.packageId) {
            throw new Error('Invalid evidence package: missing packageId');
        }

        const queueItem = {
            queueId: `REV_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            packageId: evidencePackage.packageId,
            zoneId: evidencePackage.zoneId || 'ZONE_GLOBAL',
            evidenceHash: evidencePackage.evidenceHash || crypto.createHash('sha256').update(JSON.stringify(evidencePackage)).digest('hex'),
            submittedAt: new Date().toISOString(),
            status: 'PENDING_REVIEW',
            assignedValidator: null,
            reviewRecord: null
        };

        this.reviewQueue.push(queueItem);
        return queueItem;
    }

    // 3. Process Validation Decision (APPROVE / REJECT / REQUEST_MORE_EVIDENCE)
    processDecision(queueId, validatorId, decisionData = {}) {
        const validator = this.registeredValidators.get(validatorId);
        if (!validator) throw new Error(`Unauthorized or unregistered validator: ${validatorId}`);

        const item = this.reviewQueue.find(q => q.queueId === queueId);
        if (!item) throw new Error(`Queue item ${queueId} not found`);

        const validDecisions = ['APPROVED', 'REJECTED', 'REQUEST_MORE_EVIDENCE'];
        const decision = decisionData.decision ? decisionData.decision.toUpperCase() : 'APPROVED';
        if (!validDecisions.includes(decision)) throw new Error(`Invalid decision: ${decision}`);

        const attestationPayload = {
            queueId,
            packageId: item.packageId,
            evidenceHash: item.evidenceHash,
            decision,
            validatorId,
            validatorRole: validator.role,
            noConflictOfInterest: Boolean(decisionData.noConflictOfInterest),
            notes: decisionData.notes || 'Scientific validation criteria satisfied.',
            evaluatedAt: new Date().toISOString()
        };

        const signatureReference = crypto.createHash('sha256').update(JSON.stringify(attestationPayload)).digest('hex');

        const attestationRecord = {
            ...attestationPayload,
            signatureReference,
            isPartnerValidated: decision === 'APPROVED'
        };

        item.status = decision;
        item.assignedValidator = validatorId;
        item.reviewRecord = attestationRecord;

        this.validationArchive.push(attestationRecord);
        return attestationRecord;
    }

    // 4. Retrieve Validator Queue
    getPendingQueue() {
        return this.reviewQueue.filter(q => q.status === 'PENDING_REVIEW');
    }
}

module.exports = ValidatorWorkflowEngine;
