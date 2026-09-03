/**
 * 🆔 Identity Core — Persistent Digital Identity Profile
 * Resolves Issue #23 (P1)
 */
const crypto = require('crypto');

class DigitalIdentityCore {
    constructor() {
        this.identities = new Map();
        this.provenanceChain = new Map(); // identityId -> Array<Revision>
    }

    // Generate unique, persistent Identity ID
    static generateIdentityId(seedInput) {
        const hash = crypto.createHash('sha256').update(seedInput + Date.now().toString()).digest('hex').substring(0, 24);
        return `myz:id:${hash}`;
    }

    // Create Persistent Digital Identity
    createIdentity(params) {
        const identityId = params.identityId || DigitalIdentityCore.generateIdentityId(params.handle || 'cadet');

        if (this.identities.has(identityId)) {
            throw new Error(`Identity ${identityId} already exists and is immutable`);
        }

        const now = new Date().toISOString();
        const initialRecord = {
            identityId,
            displayName: params.displayName || 'Space Cadet',
            handle: params.handle ? `@${params.handle.replace('@', '')}` : `@user_${identityId.substring(7, 13)}`,
            entityType: params.entityType || 'HUMAN',
            verificationStatus: params.verificationStatus || 'SELF_DECLARED',
            visualProfileRef: {
                avatarId: params.avatarId || 'AVT_DEFAULT',
                visualFamily: params.visualFamily || 'CYBERPUNK',
                avatarConfigUrl: params.avatarConfigUrl || `/assets/avatars/${params.avatarId || 'AVT_DEFAULT'}.json`
            },
            fields: {
                biography: params.biography || '',
                walletAddress: params.walletAddress || null,
                telemetryCoordinates: params.telemetryCoordinates || null
            },
            fieldPrivacy: {
                biography: 'PUBLIC',
                walletAddress: 'PRIVATE_STATION_ONLY', // Default private
                telemetryCoordinates: 'PRIVATE_STATION_ONLY', // Default private
                ...(params.fieldPrivacy || {})
            },
            version: 1,
            createdAt: now,
            updatedAt: now
        };

        const creationSig = crypto.createHash('sha256').update(JSON.stringify(initialRecord)).digest('hex');
        initialRecord.provenance = {
            creationSignature: creationSig,
            latestChangeHash: creationSig
        };

        this.identities.set(identityId, initialRecord);
        this.provenanceChain.set(identityId, [{
            version: 1,
            timestamp: now,
            changeType: 'GENESIS',
            changeHash: creationSig
        }]);

        return initialRecord;
    }

    // Update Visual Profile Pointer (Decoupled from Core ID)
    updateVisualProfile(identityId, newVisualRef) {
        const record = this.identities.get(identityId);
        if (!record) throw new Error(`Identity ${identityId} not found`);

        const prevHash = record.provenance.latestChangeHash;
        record.visualProfileRef = { ...record.visualProfileRef, ...newVisualRef };
        record.version += 1;
        record.updatedAt = new Date().toISOString();

        const changeHash = crypto.createHash('sha256').update(prevHash + JSON.stringify(record.visualProfileRef)).digest('hex');
        record.provenance.latestChangeHash = changeHash;

        this.provenanceChain.get(identityId).push({
            version: record.version,
            timestamp: record.updatedAt,
            changeType: 'VISUAL_UPDATE',
            changeHash
        });

        return record;
    }

    // Export Public View with Field Privacy Enforcement
    exportPublicProfile(identityId) {
        const record = this.identities.get(identityId);
        if (!record) throw new Error(`Identity ${identityId} not found`);

        const publicView = {
            identityId: record.identityId,
            displayName: record.displayName,
            handle: record.handle,
            entityType: record.entityType,
            verificationStatus: record.verificationStatus,
            visualProfileRef: record.visualProfileRef,
            version: record.version,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt
        };

        // Enforce field-level privacy
        const sanitizedFields = {};
        for (const [key, val] of Object.entries(record.fields)) {
            const priv = record.fieldPrivacy[key] || 'PRIVATE_STATION_ONLY';
            if (priv === 'PUBLIC') {
                sanitizedFields[key] = val;
            } else {
                sanitizedFields[key] = '[REDACTED_PRIVACY_BY_DESIGN]';
            }
        }
        publicView.fields = sanitizedFields;

        return publicView;
    }
}

module.exports = DigitalIdentityCore;
