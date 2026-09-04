/**
 * 🔒 Privacy Classification, Redaction & MRV-Safe Export Engine
 * Resolves Issue #21 (P1.5c)
 */
const crypto = require('crypto');

class MrvPrivacySanitizer {
    constructor() {
        this.version = 'v1.2.0';
        this.rulesetId = 'NULLIFY_MRV_SAFE_EXPORT_RULESET';
        this.classificationMap = {
            // Environmental scientific metrics (Never altered)
            'ph': 'ENVIRONMENTAL',
            'dissolvedOxygenMgL': 'ENVIRONMENTAL',
            'waterTempC': 'ENVIRONMENTAL',
            'turbidityNtu': 'ENVIRONMENTAL',
            'flowRateLps': 'ENVIRONMENTAL',
            'sampleTimestamp': 'ENVIRONMENTAL',
            'sensorId': 'ENVIRONMENTAL',

            // Operational metadata
            'batteryLevel': 'OPERATIONAL',
            'firmwareVersion': 'OPERATIONAL',
            'signalRssi': 'OPERATIONAL',

            // Personal identifying info
            'operatorName': 'PERSONAL',
            'operatorEmail': 'PERSONAL',
            'operatorPhone': 'PERSONAL',

            // Sensitive data (Strictly scrubbed)
            'walletPrivateKey': 'SENSITIVE',
            'rawWalletAddress': 'SENSITIVE',
            'internalIp': 'SENSITIVE',
            'gpsHomeCoordinates': 'SENSITIVE'
        };
    }

    // Hash PII into irreversible pseudo-identifier
    _pseudonymise(val, salt = 'MYZ_NULLIFY_SALT_2026') {
        return `anon_${crypto.createHash('sha256').update(String(val) + salt).digest('hex').substring(0, 12)}`;
    }

    // Sanitize Dataset for Public MRV / LIFE Export
    sanitizeForMrvExport(rawDataset) {
        const sanitizedEnvironmental = {};
        const sanitizedOperational = {};
        const redactedAuditLog = [];

        for (const [key, val] of Object.entries(rawDataset)) {
            const classification = this.classificationMap[key] || 'PERSONAL'; // Fail-safe default

            switch (classification) {
                case 'ENVIRONMENTAL':
                    // Invariant: Environmental data is bit-exact and untouched
                    sanitizedEnvironmental[key] = val;
                    break;

                case 'OPERATIONAL':
                    sanitizedOperational[key] = val;
                    break;

                case 'PERSONAL':
                    // Pseudonymise personal identifiers
                    const anonVal = this._pseudonymise(val);
                    sanitizedOperational[key] = anonVal;
                    redactedAuditLog.push({ field: key, action: 'PSEUDONYMISED', classification });
                    break;

                case 'SENSITIVE':
                    // Completely strip sensitive credentials/IPs
                    redactedAuditLog.push({ field: key, action: 'STRIPPED', classification });
                    break;
            }
        }

        const safeExport = {
            exportId: `MRV_SAFE_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            rulesetVersion: this.version,
            environmentalEvidence: sanitizedEnvironmental,
            operationalMetadata: sanitizedOperational,
            privacyCompliant: true,
            exportedAt: new Date().toISOString()
        };

        // Compute tamper-proof audit digest
        safeExport.provenanceHash = crypto.createHash('sha256').update(JSON.stringify(safeExport)).digest('hex');

        return {
            safeExport,
            redactedAuditLog
        };
    }
}

module.exports = MrvPrivacySanitizer;
