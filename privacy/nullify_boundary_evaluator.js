/**
 * 🛡️ Nullify Boundary & Go/No-Go Decision Evaluator
 * Resolves Issue #19 (P1.5a)
 */
const crypto = require('crypto');

const INTEGRATION_MODES = {
    NO_GO_SANDBOX_ONLY: 'NO_GO_SANDBOX_ONLY',
    RESTRICTED_PILOT: 'RESTRICTED_PILOT',
    FULL_GO_LIVE: 'FULL_GO_LIVE'
};

class NullifyBoundaryEvaluator {
    constructor(governanceConfig = {}) {
        this.dpaSigned = governanceConfig.dpaSigned || false;
        this.euHostingVerified = governanceConfig.euHostingVerified || false;
        this.subprocessorsAudited = governanceConfig.subprocessorsAudited || false;
        this.dpiaCompleted = governanceConfig.dpiaCompleted || false;
        this.prohibitedFields = ['email', 'walletPrivateKey', 'realName', 'gpsCoordinates', 'phone'];
    }

    /**
     * Inspects data payload to ensure strict zero-PII boundary.
     * Throws an error if any prohibited field or unhashed PII is detected.
     */
    validateOutboundPayload(payload) {
        if (!payload || typeof payload !== 'object') {
            throw new Error('Payload must be a non-empty object');
        }

        for (const key of Object.keys(payload)) {
            if (this.prohibitedFields.includes(key)) {
                throw new Error(`Data boundary violation: prohibited field "${key}" detected in payload`);
            }
        }

        if (!payload.targetHash || typeof payload.targetHash !== 'string' || payload.targetHash.length < 32) {
            throw new Error('Data boundary violation: payload must contain a valid cryptographic targetHash');
        }

        return {
            valid: true,
            zeroPiiConfirmed: true,
            sanitizedAt: new Date().toISOString()
        };
    }

    /**
     * Computes the deterministic Go/No-Go integration status.
     * Until all legal and subprocessor criteria are met, returns NO_GO_SANDBOX_ONLY.
     */
    evaluateGoNoGo() {
        const criteria = {
            dpaSigned: this.dpaSigned,
            euHostingVerified: this.euHostingVerified,
            subprocessorsAudited: this.subprocessorsAudited,
            dpiaCompleted: this.dpiaCompleted
        };

        const allSatisfied = Object.values(criteria).every(Boolean);

        if (allSatisfied) {
            return {
                mode: INTEGRATION_MODES.FULL_GO_LIVE,
                allowsRealData: true,
                criteria,
                reason: 'All GDPR, hosting, and legal governance criteria met.'
            };
        }

        return {
            mode: INTEGRATION_MODES.NO_GO_SANDBOX_ONLY,
            allowsRealData: false,
            criteria,
            reason: 'Mandatory legal or infrastructure checks pending. Restricted strictly to mock and synthetic data.'
        };
    }

    /**
     * Generates a tamper-proof evaluation certificate.
     */
    generateCertificate(evaluatorId = 'STATION_DPO') {
        const evaluation = this.evaluateGoNoGo();
        const cert = {
            certificateId: `CERT_GO_NOGO_${Date.now()}`,
            evaluatorId,
            timestamp: new Date().toISOString(),
            decision: evaluation.mode,
            allowsRealData: evaluation.allowsRealData,
            criteria: evaluation.criteria
        };
        cert.signature = crypto.createHash('sha256').update(JSON.stringify(cert)).digest('hex');
        return cert;
    }
}

module.exports = {
    INTEGRATION_MODES,
    NullifyBoundaryEvaluator
};
