/**
 * 🛡️ Identity Security, Privacy & Capability Boundary Engine
 * Resolves Issue #27 (P1)
 */
const crypto = require('crypto');

class IdentitySecurityEngine {
    constructor() {
        this.identities = new Map();
        this.auditLog = [];
    }

    // Register / Initialize Identity Security Record
    registerIdentity(identityId, initialData = {}) {
        const record = {
            identityId,
            verificationStatus: 'SELF_DECLARED',
            isActive: true,
            privacySettings: {
                showWalletPublicly: false, // Default private
                showCoordinatesPublicly: false, // Default private
                allowPublicCard: false
            },
            walletAddress: initialData.walletAddress || null,
            internalCoordinates: initialData.internalCoordinates || null,
            declaredSkills: initialData.declaredSkills || [],
            grantedCapabilities: new Set(), // Real technical privileges
            isSimulatedEntity: Boolean(initialData.isSimulatedEntity),
            updatedAt: new Date().toISOString()
        };

        this.identities.set(identityId, record);
        this._recordAudit(identityId, 'INITIALIZE', { status: record.verificationStatus });
        return record;
    }

    // Upgrade Verification Status
    upgradeVerification(identityId, targetStatus, proofEvidence = {}) {
        const allowedTransitions = ['SELF_DECLARED', 'DOCUMENT_BACKED', 'CRYPTOGRAPHICALLY_PROVEN', 'SYSTEM_VERIFIED'];
        if (!allowedTransitions.includes(targetStatus)) {
            throw new Error(`Invalid target verification status: ${targetStatus}`);
        }

        const record = this.identities.get(identityId);
        if (!record) throw new Error(`Identity ${identityId} not found`);
        if (!record.isActive) throw new Error(`Identity ${identityId} is disabled/revoked`);

        const prev = record.verificationStatus;
        record.verificationStatus = targetStatus;
        record.updatedAt = new Date().toISOString();

        // System verified may unlock verified-only capability
        if (targetStatus === 'SYSTEM_VERIFIED') {
            record.grantedCapabilities.add('CAN_SUBMIT_ORTO_TELEMETRY');
        }

        this._recordAudit(identityId, 'VERIFICATION_UPGRADE', { from: prev, to: targetStatus, proofEvidence });
        return record;
    }

    // Strict Capability Boundary Guard: Check technical permission
    canPerformAction(identityId, requiredCapability) {
        const record = this.identities.get(identityId);
        if (!record || !record.isActive) return false;

        // Rule: Declared skills NEVER grant technical capability
        // Only explicitly granted technical capabilities are honored
        return record.grantedCapabilities.has(requiredCapability);
    }

    // Field-Level Privacy Enforcement Filter for Public Profile View
    getPublicProfile(identityId) {
        const record = this.identities.get(identityId);
        if (!record) throw new Error(`Identity ${identityId} not found`);

        if (!record.isActive) {
            return { identityId, status: 'DISABLED' };
        }

        const view = {
            identityId: record.identityId,
            verificationStatus: record.verificationStatus,
            declaredSkills: record.declaredSkills,
            isSimulatedEntity: record.isSimulatedEntity
        };

        // Privacy enforcement: Never expose wallet or coordinates unless opted-in
        if (record.privacySettings.showWalletPublicly && record.walletAddress) {
            view.walletAddress = record.walletAddress;
        } else {
            view.walletAddress = '[REDACTED_BY_PRIVACY_POLICY]';
        }

        if (record.privacySettings.showCoordinatesPublicly && record.internalCoordinates) {
            view.coordinates = record.internalCoordinates;
        } else {
            view.coordinates = '[REDACTED_BY_PRIVACY_POLICY]';
        }

        return view;
    }

    // Disable / Revoke Identity
    disableIdentity(identityId, reason = 'Administrative Action') {
        const record = this.identities.get(identityId);
        if (!record) throw new Error(`Identity ${identityId} not found`);

        record.isActive = false;
        record.disabledReason = reason;
        record.disabledAt = new Date().toISOString();
        this._recordAudit(identityId, 'DISABLE', { reason });
        return record;
    }

    // Audit Log Internal Recorder
    _recordAudit(identityId, action, details) {
        const entry = {
            auditId: `AUD_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            identityId,
            action,
            details,
            timestamp: new Date().toISOString()
        };
        entry.signature = crypto.createHash('sha256').update(JSON.stringify(entry)).digest('hex');
        this.auditLog.push(entry);
    }
}

module.exports = IdentitySecurityEngine;
