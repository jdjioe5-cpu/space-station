const assert = require('assert');
const { ProvenanceAuditEngine } = require('../mrv/provenance_audit_trail');

async function runTestSuite() {
    console.log('🧪 Starting LIFE MRV Provenance, QA/QC & Audit Trail Tests (P0.3 — Issue #12)...');

    const engine = new ProvenanceAuditEngine();

    // 1. Ingest Valid Raw Telemetry & verify provenance_ref & decoupled QA/QC
    const rawTelemetry = {
        sensorId: 'FLOW_IN_01',
        flowRateLh: 1250,
        timestamp: new Date().toISOString()
    };
    const rawRecord = engine.ingestRawObservation(rawTelemetry, 'EDGE_GATEWAY_ES_01');
    
    assert(rawRecord.provenance_ref.startsWith('PROV_RAW_'));
    assert.strictEqual(rawRecord.lineageStage, 'RAW_INGESTION');
    assert.strictEqual(rawRecord.quality.status, 'VALID');
    assert.strictEqual(rawRecord.quality.confidenceScore, 1.0);
    assert.strictEqual(rawRecord.quality.flags.length, 0);
    console.log(`  ✅ 1. Valid Telemetry Ingested: ${rawRecord.provenance_ref} with QA/QC confidence 1.0`);

    // 2. Multi-factor QA/QC: Out-of-bounds range check
    const outlierTelemetry = {
        sensorId: 'FLOW_IN_01',
        flowRateLh: 999999, // Extreme anomaly
        timestamp: new Date().toISOString()
    };
    const outlierRecord = engine.ingestRawObservation(outlierTelemetry);
    assert.strictEqual(outlierRecord.quality.status, 'OUTLIER');
    assert(outlierRecord.quality.flags.includes('OUT_OF_PHYSICAL_RANGE'));
    assert(outlierRecord.quality.confidenceScore < 0.5);
    console.log('  ✅ 2. QA/QC Range Check: Detected physical outlier (999,999 L/h) flagged as OUTLIER');

    // 3. Multi-factor QA/QC: Duplicate detection
    const duplicateRecord = engine.ingestRawObservation(rawTelemetry);
    assert.strictEqual(duplicateRecord.quality.status, 'DUPLICATE_REJECTED');
    assert(duplicateRecord.quality.flags.includes('DUPLICATE_OBSERVATION'));
    assert.strictEqual(duplicateRecord.quality.confidenceScore, 0.0);
    console.log('  ✅ 3. QA/QC Duplicate Check: Detected & rejected duplicate telemetry tuple');

    // 4. Transform: Normalize with Parent Lineage
    const normRecord = engine.normalizeObservation(rawRecord.provenance_ref, (raw) => ({
        sensorId: raw.sensorId,
        cubicMetersPerHour: Number((raw.flowRateLh / 1000).toFixed(4)),
        unit: 'm3/h'
    }), 'CALC_NORM_SERVICE');
    
    assert(normRecord.provenance_ref.startsWith('PROV_NORM_'));
    assert.strictEqual(normRecord.parent_refs[0], rawRecord.provenance_ref);
    assert.strictEqual(normRecord.payload.cubicMetersPerHour, 1.25);
    console.log(`  ✅ 4. Normalized Transformation: ${normRecord.provenance_ref} linked to parent ${rawRecord.provenance_ref}`);

    // 5. Derive KPI & verify Multi-Parent Lineage DAG
    const kpiRecord = engine.deriveKpi([normRecord.provenance_ref], 'WATER_HOURLY_DISCHARGE_M3', (items) => ({
        aggregateCubicMeters: items[0].cubicMetersPerHour,
        period: '1h'
    }));
    
    assert(kpiRecord.provenance_ref.startsWith('PROV_KPI_'));
    assert.strictEqual(kpiRecord.quality.allParentsValid, true);
    console.log(`  ✅ 5. KPI Synthesis: ${kpiRecord.provenance_ref} linked to normalized input`);

    // 6. Trace Lineage from KPI -> Normalized -> Raw
    const lineage = engine.traceLineage(kpiRecord.provenance_ref);
    assert.strictEqual(lineage.length, 3);
    assert.strictEqual(lineage[0].lineageStage, 'KPI');
    assert.strictEqual(lineage[1].lineageStage, 'NORMALIZED');
    assert.strictEqual(lineage[2].lineageStage, 'RAW_INGESTION');
    console.log('  ✅ 6. Full Lineage Graph Traversal: Validated KPI -> Normalized -> Raw ancestry chain');

    // 7. Append-Only Immutability & Superseding
    const correctedTelemetry = {
        sensorId: 'FLOW_IN_01',
        flowRateLh: 1245,
        timestamp: new Date().toISOString()
    };
    const correctedRecord = engine.supersedeRecord(rawRecord.provenance_ref, correctedTelemetry, 'Sensor calibration recalibrated by ARPA lab');
    assert(correctedRecord.provenance_ref.startsWith('PROV_CORR_'));
    assert.strictEqual(correctedRecord.replaces, rawRecord.provenance_ref);
    // Original record remains untouched in store
    const originalFetched = engine.recordsByRef.get(rawRecord.provenance_ref);
    assert.strictEqual(originalFetched.payload.flowRateLh, 1250);
    console.log('  ✅ 7. Append-Only History: Record superseded with new audit event; original immutable history preserved');

    // 8. Cryptographic Tamper & Hash Mismatch Detection
    const integrityInitial = engine.verifyIntegrity(rawRecord.provenance_ref);
    assert.strictEqual(integrityInitial.verified, true);

    // Deliberately tamper with record payload
    rawRecord.payload.flowRateLh = 5000;
    const integrityTampered = engine.verifyIntegrity(rawRecord.provenance_ref);
    assert.strictEqual(integrityTampered.verified, false);
    assert.notStrictEqual(integrityTampered.expectedHash, integrityTampered.recordedHash);
    console.log('  ✅ 8. Tamper Detection Guard: Detected hash mismatch on unauthorized mutation');

    // 9. Certified Laboratory Ground-Truth Flag
    const labTelemetry = {
        sensorId: 'FLOW_IN_01',
        flowRateLh: 1240,
        certifiedLab: 'ARPA_LAB_REF_09',
        timestamp: new Date().toISOString()
    };
    const labRecord = engine.ingestRawObservation(labTelemetry);
    assert.strictEqual(labRecord.quality.labStatus, 'LAB_VERIFIED_GROUND_TRUTH');
    console.log('  ✅ 9. Lab Ground-Truth: Properly recognized ARPA certified reference sample');

    console.log('🎉 All LIFE MRV Provenance & QA/QC tests passed 100% with full Definition-of-Done!');
}

runTestSuite().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
