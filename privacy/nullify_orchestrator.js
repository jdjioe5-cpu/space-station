/**
 * 🛡️ Nullify Privacy-by-Design & Data Minimisation Orchestrator
 * Master integration for P1.5 (Resolves Issue #18)
 */
const crypto = require('crypto');

class NullifyPrivacyOrchestrator {
    constructor(options = {}) {
        this.nullifyEnabled = options.nullifyEnabled !== undefined ? options.nullifyEnabled : true;
        this.salt = options.salt || 'SPACE_STATION_PEPPER_9921';
        this.removalRequests = new Map();
        this.auditTrail = [];
    }

    /**
     * Step 1 & 2: Classify and Redact telemetry packet into MRV-safe format.
     */
    processIncomingPacket(rawPacket) {
        if (!rawPacket || typeof rawPacket !== 'object') {
            throw new Error('Invalid telemetry packet');
        }

        const mrvDataset = {
            stationId: rawPacket.stationId || 'STATION_DEFAULT',
            timestamp: rawPacket.timestamp || new Date().toISOString(),
            environmentalMetrics: { ...rawPacket.environmentalMetrics }, // 100% preserved
            operatorPseudonym: null
        };

        // Redact & Pseudonymize operator PII
        if (rawPacket.operator && rawPacket.operator.email) {
            mrvDataset.operatorPseudonym = crypto.createHash('sha256')
                .update(rawPacket.operator.email + this.salt)
                .digest('hex')
                .substring(0, 16);
        }

        // Record audit
        this._recordAudit('PACKET_MINIMISED', {
            stationId: mrvDataset.stationId,
            hasOperatorPseudonym: Boolean(mrvDataset.operatorPseudonym)
        });

        return mrvDataset;
    }

    /**
     * Step 3: Register a Privacy Removal Request (Human Gate required)
     */
    createRemovalDirective(operatorEmail, reason = 'GDPR_RIGHT_TO_ERASURE') {
        const targetHash = crypto.createHash('sha256').update(operatorEmail + this.salt).digest('hex');
        const requestId = `PRV_DIR_${crypto.randomBytes(6).toString('hex')}`;
        
        const directive = {
            requestId,
            targetHash,
            reason,
            status: 'PENDING_HUMAN_APPROVAL',
            approvedBy: null,
            dispatched: false,
            createdAt: new Date().toISOString()
        };

        this.removalRequests.set(requestId, directive);
        this._recordAudit('REMOVAL_REQUESTED', { requestId, targetHash });
        return directive;
    }

    /**
     * Human Sign-Off Gate
     */
    approveRemovalDirective(requestId, operatorRole = 'STATION_COMMANDER') {
        const directive = this.removalRequests.get(requestId);
        if (!directive) throw new Error(`Directive ${requestId} not found`);
        
        directive.status = 'APPROVED';
        directive.approvedBy = operatorRole;
        this._recordAudit('REMOVAL_APPROVED', { requestId, approvedBy: operatorRole });
        return directive;
    }

    /**
     * Dispatch removal to Nullify (Resilient: failure never breaks station)
     */
    async dispatchDirective(requestId, nullifyProvider = null) {
        const directive = this.removalRequests.get(requestId);
        if (!directive) throw new Error(`Directive ${requestId} not found`);
        if (directive.status !== 'APPROVED') {
            throw new Error(`Directive ${requestId} requires human approval before dispatch`);
        }

        if (!this.nullifyEnabled || !nullifyProvider) {
            directive.status = 'COMPLETED_OFFLINE';
            directive.dispatched = false;
            this._recordAudit('REMOVAL_DISPATCH_OFFLINE', { requestId });
            return directive;
        }

        try {
            const resp = await nullifyProvider.submitRemoval(directive.requestId, directive.targetHash);
            directive.status = 'DISPATCHED_TO_NULLIFY';
            directive.externalId = resp.externalId;
            directive.dispatched = true;
            this._recordAudit('REMOVAL_DISPATCH_SUCCESS', { requestId, externalId: resp.externalId });
            return directive;
        } catch (err) {
            directive.status = 'DISPATCH_ERROR_ISOLATED';
            directive.error = err.message;
            this._recordAudit('REMOVAL_DISPATCH_FAILED_ISOLATED', { requestId, error: err.message });
            return directive;
        }
    }

    _recordAudit(action, meta) {
        const entry = {
            auditId: `AUD_P15_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            action,
            meta,
            timestamp: new Date().toISOString()
        };
        entry.signature = crypto.createHash('sha256').update(JSON.stringify(entry)).digest('hex');
        this.auditTrail.push(entry);
    }
}

module.exports = {
    NullifyPrivacyOrchestrator
};
