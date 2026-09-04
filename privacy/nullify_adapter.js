/**
 * 🛡️ Nullify Adapter & Privacy Request Workflow Engine
 * Resolves Issue #20 (P1.5b)
 */
const crypto = require('crypto');

class PrivacyRemovalProvider {
    async submitRemoval(requestId, targetHash) { throw new Error('Not implemented'); }
    async getStatus(externalId) { throw new Error('Not implemented'); }
    async cancel(externalId) { throw new Error('Not implemented'); }
}

class MockNullifyProvider extends PrivacyRemovalProvider {
    constructor() {
        super();
        this.records = new Map();
    }

    async submitRemoval(requestId, targetHash) {
        const externalId = `nullify_ext_${crypto.randomBytes(4).toString('hex')}`;
        this.records.set(externalId, { requestId, targetHash, status: 'SUBMITTED' });
        return { externalId, status: 'SUBMITTED' };
    }

    async getStatus(externalId) {
        const record = this.records.get(externalId);
        if (!record) throw new Error(`External ID ${externalId} not found`);
        return { externalId, status: record.status };
    }

    async cancel(externalId) {
        const record = this.records.get(externalId);
        if (!record) throw new Error(`External ID ${externalId} not found`);
        record.status = 'CANCELLED';
        return { externalId, status: 'CANCELLED' };
    }
}

class NullifyAdapterService {
    constructor(provider = null, options = {}) {
        this.enabled = options.enabled !== undefined ? options.enabled : true;
        this.provider = provider || new MockNullifyProvider();
        this.requests = new Map();
        this.auditLog = [];
    }

    // Create a new privacy removal request with payload minimization (hashes only, zero PII)
    createRemovalRequest(targetHash, reason = 'DATA_MINIMISATION_REQUEST') {
        const requestId = `PRV_REQ_${crypto.randomBytes(6).toString('hex')}`;
        const now = new Date().toISOString();

        const record = {
            requestId,
            targetHash, // Anonymized hash identifier only
            reason,
            status: 'PENDING_APPROVAL',
            approvedByHuman: false,
            externalProviderId: null,
            createdAt: now,
            updatedAt: now
        };

        this.requests.set(requestId, record);
        this._recordAudit(requestId, 'CREATED', { targetHash });
        return record;
    }

    // Human Approval Gate
    approveRequest(requestId, operatorId = 'STATION_OPERATOR') {
        const record = this.requests.get(requestId);
        if (!record) throw new Error(`Request ${requestId} not found`);
        if (record.status !== 'PENDING_APPROVAL') throw new Error(`Request cannot be approved in state ${record.status}`);

        record.approvedByHuman = true;
        record.approvedBy = operatorId;
        record.updatedAt = new Date().toISOString();
        this._recordAudit(requestId, 'HUMAN_APPROVED', { operatorId });
        return record;
    }

    // Dispatch to Nullify Provider (Non-blocking: failures never break MRV telemetry)
    async dispatchToProvider(requestId) {
        const record = this.requests.get(requestId);
        if (!record) throw new Error(`Request ${requestId} not found`);
        if (!record.approvedByHuman) throw new Error(`Human approval required before dispatch`);

        if (!this.enabled) {
            record.status = 'COMPLETED_OFFLINE';
            this._recordAudit(requestId, 'DISPATCH_SKIPPED_OFFLINE', {});
            return record;
        }

        try {
            const resp = await this.provider.submitRemoval(record.requestId, record.targetHash);
            record.externalProviderId = resp.externalId;
            record.status = resp.status;
            record.updatedAt = new Date().toISOString();
            this._recordAudit(requestId, 'DISPATCH_SUCCESS', { externalId: resp.externalId });
            return record;
        } catch (err) {
            // Fail safe: isolate error, log event, do not crash
            this._recordAudit(requestId, 'DISPATCH_ERROR', { error: err.message });
            return { ...record, dispatchError: err.message };
        }
    }

    // Audit Logging with Zero Raw PII
    _recordAudit(requestId, action, meta) {
        const entry = {
            auditId: `AUD_PRV_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            requestId,
            action,
            meta, // Contains only hashes and statuses
            timestamp: new Date().toISOString()
        };
        entry.signature = crypto.createHash('sha256').update(JSON.stringify(entry)).digest('hex');
        this.auditLog.push(entry);
    }
}

module.exports = {
    PrivacyRemovalProvider,
    MockNullifyProvider,
    NullifyAdapterService
};
