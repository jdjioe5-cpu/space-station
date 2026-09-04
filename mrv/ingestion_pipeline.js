const fs = require('fs');
const path = require('path');
/**
 * 📥 Sensor & Partner API Ingestion Pipeline
 * Resolves Issue #11 (P0.2 — Sensor & Partner API Ingestion Pipeline)
 */
const crypto = require('crypto');

class IngestionPipeline {
    constructor() {
        this.store = new Map(); // observation_id -> canonical record
        this.rawStore = new Map(); // rawHash -> raw payload
        this.seenFingerprints = new Set();
        this.deadLetterQueue = [];
        this.sourceMetrics = new Map(); // source_id -> health stats
    }

    /**
     * Helper: compute SHA-256
     */
    computeHash(data) {
        return crypto.createHash('sha256').update(typeof data === 'string' ? data : JSON.stringify(data)).digest('hex');
    }

    /**
     * Updates source telemetry health metrics
     */
    _recordSourceMetric(sourceId, success = true) {
        const stats = this.sourceMetrics.get(sourceId) || {
            source_id: sourceId,
            totalIngested: 0,
            failedIngested: 0,
            lastSeen: null,
            status: 'ACTIVE'
        };
        if (success) {
            stats.totalIngested++;
            stats.lastSeen = new Date().toISOString();
        } else {
            stats.failedIngested++;
        }
        this.sourceMetrics.set(sourceId, stats);
    }

    /**
     * Validates and normalizes canonical fields
     */
    _validateCanonical(payload) {
        const errors = [];
        if (!this.canonicalSchema) {
            const schemaPath = path.join(__dirname, '../schemas/sensor-observation.schema.json');
            if (fs.existsSync(schemaPath)) {
                this.canonicalSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
            }
        }

        if (this.canonicalSchema) {
            // Validate required fields per Draft-07 canonical schema
            const required = this.canonicalSchema.required || [];
            for (const req of required) {
                if (payload[req] === undefined || payload[req] === null) {
                    errors.push(`Missing required field: ${req}`);
                }
            }

            // Validate value is finite non-negative or numeric per schema
            if (payload.value !== undefined) {
                if (typeof payload.value !== 'number' || isNaN(payload.value)) {
                    errors.push('Missing or invalid numerical field: value');
                }
            }

            // Validate timestamp format
            if (payload.timestamp && isNaN(new Date(payload.timestamp).getTime())) {
                errors.push('Invalid ISO-8601 date-time format for timestamp');
            }

            // Validate domain enum if declared
            if (payload.domain && this.canonicalSchema.properties?.domain?.enum) {
                if (!this.canonicalSchema.properties.domain.enum.includes(payload.domain)) {
                    errors.push(`Invalid domain enum: ${payload.domain}`);
                }
            }
        } else {
            // Fallback assertion
            if (!payload.source_id) errors.push('Missing required field: source_id');
            if (!payload.pilot_id) errors.push('Missing required field: pilot_id');
            if (!payload.parameter) errors.push('Missing required field: parameter');
            if (payload.value === undefined || typeof payload.value !== 'number') errors.push('Invalid value');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * POST /observations: Ingest single telemetry record
     */
    ingestObservation(rawPayload, partnerType = 'GENERIC_REST') {
        const rawHash = this.computeHash(rawPayload);
        this.rawStore.set(rawHash, {
            raw: rawPayload,
            partnerType,
            receivedAt: new Date().toISOString()
        });

        // 1. Adapter normalization
        let canonical;
        try {
            canonical = this.normalizePayload(rawPayload, partnerType);
        } catch (err) {
            const dlqEntry = {
                dlq_id: `DLQ_${Date.now()}_${this.deadLetterQueue.length + 1}`,
                rawPayload,
                rawHash,
                error: `Adapter normalization failure: ${err.message}`,
                timestamp: new Date().toISOString()
            };
            this.deadLetterQueue.push(dlqEntry);
            if (rawPayload && rawPayload.source_id) this._recordSourceMetric(rawPayload.source_id, false);
            return { success: false, status: 'REJECTED_TO_DLQ', error: dlqEntry.error, dlq_id: dlqEntry.dlq_id };
        }

        // Populate canonical envelope metadata prior to validation
        canonical.observation_id = canonical.observation_id || `OBS_${canonical.domain || 'WATER'}_${rawHash.substring(0, 16)}`;
        canonical.provenance_ref = canonical.provenance_ref || `PROV_INGEST_${rawHash.substring(0, 16)}`;
        canonical.quality_flag = canonical.quality_flag || 'VALID';

        // 2. Canonical validation
        const validation = this._validateCanonical(canonical);
        if (!validation.isValid) {
            const dlqEntry = {
                dlq_id: `DLQ_${Date.now()}_${this.deadLetterQueue.length + 1}`,
                rawPayload,
                rawHash,
                error: `Canonical validation failed: ${validation.errors.join('; ')}`,
                timestamp: new Date().toISOString()
            };
            this.deadLetterQueue.push(dlqEntry);
            this._recordSourceMetric(canonical.source_id || 'UNKNOWN', false);
            return { success: false, status: 'REJECTED_TO_DLQ', error: dlqEntry.error, dlq_id: dlqEntry.dlq_id };
        }

        // 3. Idempotent Deduplication Check
        const fingerprint = `${canonical.source_id}_${canonical.timestamp}_${canonical.parameter}_${canonical.value}`;
        if (this.seenFingerprints.has(fingerprint)) {
            return {
                success: true,
                status: 'DUPLICATE_IGNORED',
                message: 'Observation already processed. Idempotently ignored without altering metrics.',
                rawHash
            };
        }

        // 4. Ingestion & Provenance Envelope
        const observation_id = canonical.observation_id || `OBS_${canonical.domain}_${rawHash.substring(0, 16)}`;
        const provenance_ref = canonical.provenance_ref || `PROV_INGEST_${rawHash.substring(0, 16)}`;

        const record = {
            ...canonical,
            observation_id,
            provenance_ref,
            rawHash,
            quality_flag: canonical.quality_flag || 'VALID',
            ingestedAt: new Date().toISOString()
        };

        this.seenFingerprints.add(fingerprint);
        this.store.set(observation_id, record);
        this._recordSourceMetric(canonical.source_id, true);

        return {
            success: true,
            status: 'INGESTED',
            observation_id,
            provenance_ref,
            rawHash
        };
    }

    /**
     * POST /observations/batch: Ingest batch of observations (JSON Array or CSV string)
     */
    ingestBatch(payload, partnerType = 'GENERIC_REST') {
        let items = [];
        if (typeof payload === 'string') {
            // Parse CSV format
            items = this.parseCsv(payload);
        } else if (Array.isArray(payload)) {
            items = payload;
        } else {
            throw new Error('Batch payload must be either a CSV string or an Array of objects');
        }

        const summary = {
            total: items.length,
            ingested: 0,
            duplicates: 0,
            failed: 0,
            results: []
        };

        for (const item of items) {
            const res = this.ingestObservation(item, partnerType);
            summary.results.push(res);
            if (res.status === 'INGESTED') summary.ingested++;
            else if (res.status === 'DUPLICATE_IGNORED') summary.duplicates++;
            else summary.failed++;
        }

        return summary;
    }

    /**
     * Native CSV Parser for Municipal Meter and Utility Data
     */
    parseCsv(csvText) {
        const lines = csvText.trim().split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim());
        const records = [];

        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim());
            const row = {};
            headers.forEach((h, idx) => {
                row[h] = cols[idx];
            });
            records.push(row);
        }
        return records;
    }

    /**
     * Normalization Adapters for Heterogeneous Partner Formats
     */
    normalizePayload(raw, partnerType) {
        if (partnerType === 'IOT_MQTT') {
            // IoT sensor payload: { devId, flow_lpm, ts, zone }
            return {
                source_id: raw.devId,
                pilot_id: raw.pilotId || 'PILOT_LIFE_ES_001',
                domain: 'WATER',
                parameter: 'water_flow_rate',
                value: Number(((raw.flow_lpm || 0) * 60).toFixed(2)), // convert L/min to L/h
                unit: 'L/h',
                timestamp: raw.ts || new Date().toISOString(),
                location: { zone_id: raw.zone || 'ZONE_DEFAULT' }
            };
        } else if (partnerType === 'UTILITY_CSV') {
            // Utility CSV format: date,meter_id,consumption_m3,pilot_id
            return {
                source_id: raw.meter_id,
                pilot_id: raw.pilot_id || 'PILOT_LIFE_ES_001',
                domain: 'WATER',
                parameter: 'recycled_water_volume',
                value: Number(parseFloat(raw.consumption_m3 || 0).toFixed(3)),
                unit: 'm3',
                timestamp: new Date(raw.date).toISOString(),
                location: { zone_id: 'MUNICIPAL_DISTRICT_1' }
            };
        } else if (partnerType === 'LAB_REPORT') {
            // Lab report format: lab_id,sample_id,ph_level,timestamp
            return {
                source_id: raw.lab_id,
                pilot_id: raw.pilot_id || 'PILOT_LIFE_ES_001',
                domain: 'WATER',
                parameter: 'ph',
                value: parseFloat(raw.ph_level),
                unit: 'pH',
                timestamp: raw.timestamp,
                location: { zone_id: raw.zone_id || 'LAB_STATION_A' },
                quality_flag: 'LAB_VERIFIED'
            };
        }
        // Generic canonical passthrough
        return {
            ...raw,
            value: typeof raw.value === 'string' ? parseFloat(raw.value) : raw.value
        };
    }

    /**
     * GET /sources/{source_id}/status: Retrieve health and metrics for a telemetry source
     */
    getSourceStatus(sourceId) {
        const stats = this.sourceMetrics.get(sourceId);
        if (!stats) throw new Error(`Source ${sourceId} not found`);
        return stats;
    }

    /**
     * Retrieve Dead-Letter Queue items
     */
    getDeadLetterQueue() {
        return this.deadLetterQueue;
    }
}

module.exports = {
    IngestionPipeline
};
