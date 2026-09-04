const assert = require('assert');
const { IngestionPipeline } = require('../mrv/ingestion_pipeline');

async function runTestSuite() {
    console.log('🧪 Starting Sensor & Partner API Ingestion Pipeline Tests (P0.2 — Issue #11)...');

    const pipeline = new IngestionPipeline();

    // 1. Single Ingestion with Raw Preservation & Canonical Validation
    const singlePayload = {
        source_id: 'SENSOR_FLOW_01',
        pilot_id: 'PILOT_LIFE_ES_001',
        domain: 'WATER',
        parameter: 'water_flow_rate',
        value: 1250,
        unit: 'L/h',
        timestamp: '2026-08-15T08:00:00.000Z',
        location: { zone_id: 'VALENCIA_ZONE_A' }
    };

    const res1 = pipeline.ingestObservation(singlePayload);
    assert.strictEqual(res1.success, true);
    assert.strictEqual(res1.status, 'INGESTED');
    assert(res1.observation_id.startsWith('OBS_WATER_'));
    assert(res1.provenance_ref.startsWith('PROV_INGEST_'));
    assert.strictEqual(res1.rawHash.length, 64);
    console.log(`  ✅ 1. Single Ingestion: Successfully normalized & stored (${res1.observation_id})`);

    // 2. Idempotent Deduplication Check (Same record ingested again)
    const duplicateRes = pipeline.ingestObservation(singlePayload);
    assert.strictEqual(duplicateRes.success, true);
    assert.strictEqual(duplicateRes.status, 'DUPLICATE_IGNORED');
    assert.strictEqual(pipeline.store.size, 1); // Size should not increase
    console.log('  ✅ 2. Idempotency Guard: Re-submitting identical payload ignored without skewing metrics');

    // 3. Partner Adapter: IoT MQTT format conversion
    const iotRaw = {
        devId: 'EDGE_PUMP_09',
        flow_lpm: 20, // 20 L/min -> 1200 L/h
        ts: '2026-08-15T08:05:00.000Z',
        zone: 'IRRIGATION_SECTOR_4'
    };
    const iotRes = pipeline.ingestObservation(iotRaw, 'IOT_MQTT');
    assert.strictEqual(iotRes.status, 'INGESTED');
    const storedIot = pipeline.store.get(iotRes.observation_id);
    assert.strictEqual(storedIot.value, 1200);
    assert.strictEqual(storedIot.unit, 'L/h');
    console.log('  ✅ 3. IoT Adapter: Normalized 20 L/min to canonical 1,200 L/h');

    // 4. Batch Import: CSV text parsing & batch ingestion
    const csvData = `date,meter_id,consumption_m3,pilot_id
2026-08-15T09:00:00.000Z,METER_VAL_01,1.450,PILOT_LIFE_ES_001
2026-08-15T10:00:00.000Z,METER_VAL_01,1.350,PILOT_LIFE_ES_001
2026-08-15T11:00:00.000Z,METER_VAL_01,1.550,PILOT_LIFE_ES_001`;

    const batchSummary = pipeline.ingestBatch(csvData, 'UTILITY_CSV');
    assert.strictEqual(batchSummary.total, 3);
    assert.strictEqual(batchSummary.ingested, 3);
    assert.strictEqual(batchSummary.failed, 0);
    console.log('  ✅ 4. Batch CSV Import: Processed 3 utility observations with 100% success');

    // 5. Validation Failure & Dead-Letter Queue (DLQ)
    const malformedPayload = {
        source_id: 'BROKEN_SENSOR',
        pilot_id: 'PILOT_LIFE_ES_001',
        domain: 'WATER',
        parameter: 'water_flow_rate',
        value: 'NOT_A_NUMBER', // Invalid!
        unit: 'L/h',
        timestamp: 'invalid-date'
    };
    const failedRes = pipeline.ingestObservation(malformedPayload);
    assert.strictEqual(failedRes.success, false);
    assert.strictEqual(failedRes.status, 'REJECTED_TO_DLQ');
    assert(failedRes.error.includes('Missing or invalid numerical field'));
    assert.strictEqual(pipeline.getDeadLetterQueue().length, 1);
    console.log('  ✅ 5. Dead-Letter Queue (DLQ): Isolated invalid observation with readable rejection reason');

    // 6. Source Telemetry Observability (GET /sources/{source_id}/status)
    const status = pipeline.getSourceStatus('METER_VAL_01');
    assert.strictEqual(status.totalIngested, 3);
    assert.strictEqual(status.failedIngested, 0);
    assert.strictEqual(status.status, 'ACTIVE');
    console.log(`  ✅ 6. Source Status API: Verified healthy telemetry source (${status.source_id})`);

    console.log('🎉 All Sensor & Partner API Ingestion Pipeline tests passed 100% with full Definition-of-Done!');
}

runTestSuite().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
