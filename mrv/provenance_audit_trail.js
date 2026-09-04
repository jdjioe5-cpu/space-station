/**
 * 🛡️ LIFE MRV Provenance, QA/QC & Immutable Audit Trail Engine
 * Resolves Issue #12 (P0.3 — Provenance, QA/QC & Immutable Audit Trail)
 */
const crypto = require('crypto');

class ProvenanceAuditEngine {
    constructor() {
        this.auditLog = [];
        this.recordsByRef = new Map();
        this.observedSignatures = new Set(); // For duplicate detection
    }

    /**
     * Computes deterministic SHA-256 hash of canonical JSON
     */
    computeHash(data) {
        return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    }

    /**
     * Decoupled QA/QC Multi-Factor Validation
     */
    validateQAQC(observation, rules = {}) {
        const flags = [];
        let confidenceScore = 1.0;
        let status = 'VALID';

        const defaultRules = {
            minFlowRate: 0,
            maxFlowRate: 20000, // L/h
            minPh: 5.5,
            maxPh: 9.0,
            maxTimestampFutureDriftMs: 60000, // 1 min
            ...rules
        };

        // 1. Missing Value Check
        if (observation.flowRateLh === null || observation.flowRateLh === undefined) {
            flags.push('MISSING_VALUE');
            confidenceScore -= 0.8;
            status = 'INVALID';
        }

        // 2. Physical Range Check
        if (observation.flowRateLh !== undefined && observation.flowRateLh !== null) {
            if (observation.flowRateLh < defaultRules.minFlowRate || observation.flowRateLh > defaultRules.maxFlowRate) {
                flags.push('OUT_OF_PHYSICAL_RANGE');
                confidenceScore -= 0.7;
                status = 'OUTLIER';
            }
        }

        if (observation.ph !== undefined && observation.ph !== null) {
            if (observation.ph < defaultRules.minPh || observation.ph > defaultRules.maxPh) {
                flags.push('CHEMICAL_PARAMETER_OUT_OF_BOUNDS');
                confidenceScore -= 0.5;
                if (status === 'VALID') status = 'OUTLIER';
            }
        }

        // 3. Timestamp Consistency Check
        if (observation.timestamp) {
            const obsTime = new Date(observation.timestamp).getTime();
            const now = Date.now();
            if (isNaN(obsTime)) {
                flags.push('INVALID_TIMESTAMP_FORMAT');
                status = 'INVALID';
                confidenceScore = 0.0;
            } else if (obsTime > now + defaultRules.maxTimestampFutureDriftMs) {
                flags.push('FUTURE_TIMESTAMP_DRIFT');
                status = 'INVALID';
                confidenceScore -= 0.6;
            }
        } else {
            flags.push('TIMESTAMP_ABSENT');
            status = 'INVALID';
            confidenceScore = 0.0;
        }

        // 4. Duplicate Detection Check
        const sig = `${observation.sensorId || 'UNKNOWN'}_${observation.timestamp}`;
        if (this.observedSignatures.has(sig)) {
            flags.push('DUPLICATE_OBSERVATION');
            status = 'DUPLICATE_REJECTED';
            confidenceScore = 0.0;
        }

        // 5. Reference / Lab Calibration Status
        let labStatus = 'UNVERIFIED_FIELD_SENSOR';
        if (observation.certifiedLab) {
            labStatus = 'LAB_VERIFIED_GROUND_TRUTH';
            confidenceScore = Math.min(1.0, confidenceScore + 0.1);
        }

        confidenceScore = Math.max(0.0, Math.min(1.0, Number(confidenceScore.toFixed(2))));

        return {
            status,
            flags,
            confidenceScore,
            labStatus,
            evaluatedAt: new Date().toISOString()
        };
    }

    /**
     * Ingest Raw Observation with Full Provenance Wrapping & QA/QC
     */
    ingestRawObservation(payload, actor = 'SENSOR_INGEST_SERVICE') {
        const qaqc = this.validateQAQC(payload);
        
        // Record signature to guard against duplicates
        const sig = `${payload.sensorId || 'UNKNOWN'}_${payload.timestamp}`;
        if (!qaqc.flags.includes('DUPLICATE_OBSERVATION')) {
            this.observedSignatures.add(sig);
        }

        const canonicalContent = {
            rawTelemetry: payload,
            qaqcEvaluation: qaqc
        };
        const contentHash = this.computeHash(canonicalContent);
        const provenanceRef = `PROV_RAW_${contentHash.substring(0, 16)}`;

        const record = {
            provenance_ref: provenanceRef,
            lineageStage: 'RAW_INGESTION',
            parent_refs: [],
            content_hash: contentHash,
            payload: payload,
            quality: qaqc,
            actor: actor,
            timestamp: new Date().toISOString()
        };

        this.recordsByRef.set(provenanceRef, record);
        this.appendAuditEvent('INGEST_RAW', provenanceRef, actor, { status: qaqc.status });

        return record;
    }

    /**
     * Normalize Observation with Full Lineage Linking
     */
    normalizeObservation(rawProvenanceRef, normalizationFn, actor = 'NORMALIZATION_PIPELINE') {
        const rawRecord = this.recordsByRef.get(rawProvenanceRef);
        if (!rawRecord) {
            throw new Error(`Raw record ${rawProvenanceRef} not found`);
        }

        const normalizedPayload = normalizationFn(rawRecord.payload);
        const canonicalContent = {
            normalizedData: normalizedPayload,
            derivedFrom: rawRecord.content_hash
        };
        const contentHash = this.computeHash(canonicalContent);
        const provenanceRef = `PROV_NORM_${contentHash.substring(0, 16)}`;

        const record = {
            provenance_ref: provenanceRef,
            lineageStage: 'NORMALIZED',
            parent_refs: [rawProvenanceRef],
            content_hash: contentHash,
            payload: normalizedPayload,
            quality: {
                ...rawRecord.quality,
                normalized: true
            },
            actor: actor,
            timestamp: new Date().toISOString()
        };

        this.recordsByRef.set(provenanceRef, record);
        this.appendAuditEvent('TRANSFORM_NORMALIZE', provenanceRef, actor, { parent: rawProvenanceRef });

        return record;
    }

    /**
     * Synthesize MRV KPI with Multi-Parent Cryptographic Lineage
     */
    deriveKpi(normalizedRefs, kpiName, calculatorFn, actor = 'MRV_KPI_CALCULATOR') {
        const parents = normalizedRefs.map(ref => {
            const rec = this.recordsByRef.get(ref);
            if (!rec) throw new Error(`Parent reference ${ref} not found`);
            return rec;
        });

        const parentHashes = parents.map(p => p.content_hash);
        const inputData = parents.map(p => p.payload);
        const kpiResult = calculatorFn(inputData);

        // Aggregate overall confidence from parents
        const avgConfidence = Number((parents.reduce((acc, p) => acc + (p.quality.confidenceScore || 0), 0) / parents.length).toFixed(2));

        const canonicalContent = {
            kpiName,
            kpiResult,
            parentHashes
        };
        const contentHash = this.computeHash(canonicalContent);
        const provenanceRef = `PROV_KPI_${contentHash.substring(0, 16)}`;

        const record = {
            provenance_ref: provenanceRef,
            lineageStage: 'KPI',
            kpiName,
            parent_refs: normalizedRefs,
            content_hash: contentHash,
            payload: kpiResult,
            quality: {
                aggregatedConfidence: avgConfidence,
                parentSampleCount: parents.length,
                allParentsValid: parents.every(p => p.quality.status === 'VALID')
            },
            actor: actor,
            timestamp: new Date().toISOString()
        };

        this.recordsByRef.set(provenanceRef, record);
        this.appendAuditEvent('CALCULATE_KPI', provenanceRef, actor, { kpi: kpiName, parentCount: parents.length });

        return record;
    }

    /**
     * Append-Only Audit Trail Recording
     */
    appendAuditEvent(eventType, provenanceRef, actor, details = {}) {
        const event = {
            eventId: `EVT_${Date.now()}_${this.auditLog.length + 1}`,
            eventType,
            provenance_ref: provenanceRef,
            actor,
            details,
            timestamp: new Date().toISOString()
        };
        event.signature = this.computeHash(event);
        this.auditLog.push(event);
        return event;
    }

    /**
     * Supersede / Correct Record (Append-only: creates replacement event without deleting original)
     */
    supersedeRecord(oldProvenanceRef, correctedPayload, reason, actor = 'DATA_STEWARD') {
        const oldRecord = this.recordsByRef.get(oldProvenanceRef);
        if (!oldRecord) throw new Error(`Original record ${oldProvenanceRef} not found`);

        const qaqc = this.validateQAQC(correctedPayload);
        const canonicalContent = {
            correctedPayload,
            replacesRef: oldProvenanceRef,
            reason
        };
        const contentHash = this.computeHash(canonicalContent);
        const newRef = `PROV_CORR_${contentHash.substring(0, 16)}`;

        const newRecord = {
            provenance_ref: newRef,
            lineageStage: 'CORRECTION',
            parent_refs: [oldProvenanceRef],
            content_hash: contentHash,
            payload: correctedPayload,
            quality: qaqc,
            actor: actor,
            replaces: oldProvenanceRef,
            reason,
            timestamp: new Date().toISOString()
        };

        this.recordsByRef.set(newRef, newRecord);
        this.appendAuditEvent('SUPERSEDE_RECORD', newRef, actor, {
            previousRef: oldProvenanceRef,
            reason
        });

        return newRecord;
    }

    /**
     * Full Traceability Lineage Traversal (KPI -> Normalized -> Raw)
     */
    traceLineage(provenanceRef) {
        const trace = [];
        const visited = new Set();

        const traverse = (ref) => {
            if (!ref || visited.has(ref)) return;
            visited.add(ref);
            const record = this.recordsByRef.get(ref);
            if (!record) return;

            trace.push({
                provenance_ref: record.provenance_ref,
                lineageStage: record.lineageStage,
                content_hash: record.content_hash,
                qualityStatus: record.quality.status || (record.quality.allParentsValid ? 'KPI_VERIFIED' : 'KPI_PROVISIONAL'),
                timestamp: record.timestamp
            });

            for (const parentRef of record.parent_refs) {
                traverse(parentRef);
            }
        };

        traverse(provenanceRef);
        return trace;
    }

    /**
     * Tampering & Hash Verification Guard
     */
    verifyIntegrity(provenanceRef) {
        const record = this.recordsByRef.get(provenanceRef);
        if (!record) throw new Error(`Record ${provenanceRef} not found`);

        let canonical;
        if (record.lineageStage === 'RAW_INGESTION') {
            canonical = {
                rawTelemetry: record.payload,
                qaqcEvaluation: record.quality
            };
        } else if (record.lineageStage === 'NORMALIZED') {
            const rawParent = this.recordsByRef.get(record.parent_refs[0]);
            canonical = {
                normalizedData: record.payload,
                derivedFrom: rawParent ? rawParent.content_hash : null
            };
        } else if (record.lineageStage === 'KPI') {
            const parentHashes = record.parent_refs.map(r => {
                const p = this.recordsByRef.get(r);
                return p ? p.content_hash : null;
            });
            canonical = {
                kpiName: record.kpiName,
                kpiResult: record.payload,
                parentHashes
            };
        } else if (record.lineageStage === 'CORRECTION') {
            canonical = {
                correctedPayload: record.payload,
                replacesRef: record.replaces,
                reason: record.reason
            };
        }

        const expectedHash = this.computeHash(canonical);
        const matches = expectedHash === record.content_hash;
        return {
            provenance_ref: record.provenance_ref,
            verified: matches,
            expectedHash,
            recordedHash: record.content_hash
        };
    }
}

module.exports = {
    ProvenanceAuditEngine
};
