/**
 * 🌿 Environmental MRV Core & Evidence Package Engine
 * Resolves Issue #42 (P0)
 */
const crypto = require('crypto');

class MrvCoreEngine {
    constructor() {
        this.evidencePackages = new Map();
        this.provenanceChain = [];
    }

    // Build and bundle Evidence Package with Cryptographic Provenance
    createEvidencePackage(packagePayload) {
        if (!packagePayload || !packagePayload.packageId || !packagePayload.claimRef) {
            throw new Error('Invalid evidence package: missing packageId or claimRef');
        }

        const observations = packagePayload.observations || [];
        const payloadToHash = {
            packageId: packagePayload.packageId,
            claimRef: packagePayload.claimRef,
            zoneId: packagePayload.zoneId || 'ZONE_GLOBAL',
            observations,
            createdAt: new Date().toISOString()
        };

        // Cryptographic Provenance Hash
        const provenanceHash = crypto.createHash('sha256').update(JSON.stringify(payloadToHash)).digest('hex');

        // Link with previous chain block
        const prevHash = this.provenanceChain.length > 0 ? this.provenanceChain[this.provenanceChain.length - 1].blockHash : 'GENESIS_EVIDENCE_BLOCK';
        const blockHash = crypto.createHash('sha256').update(provenanceHash + prevHash).digest('hex');

        const evidencePackage = {
            ...payloadToHash,
            provenanceHash,
            prevHash,
            blockHash,
            status: 'COLLECTED'
        };

        this.evidencePackages.set(evidencePackage.packageId, evidencePackage);
        this.provenanceChain.push({
            blockIndex: this.provenanceChain.length,
            packageId: evidencePackage.packageId,
            blockHash,
            timestamp: payloadToHash.createdAt
        });

        return evidencePackage;
    }

    // Verify Integrity of an Evidence Package
    verifyEvidencePackage(packageId) {
        const pkg = this.evidencePackages.get(packageId);
        if (!pkg) throw new Error(`Evidence package ${packageId} not found`);

        const recalculation = {
            packageId: pkg.packageId,
            claimRef: pkg.claimRef,
            zoneId: pkg.zoneId,
            observations: pkg.observations,
            createdAt: pkg.createdAt
        };

        const rehash = crypto.createHash('sha256').update(JSON.stringify(recalculation)).digest('hex');
        const isValid = (rehash === pkg.provenanceHash);

        if (isValid) {
            pkg.status = 'HASH_VERIFIED';
        } else {
            pkg.status = 'REJECTED';
        }

        return {
            packageId,
            isValid,
            status: pkg.status,
            provenanceHash: pkg.provenanceHash
        };
    }
}

module.exports = MrvCoreEngine;
