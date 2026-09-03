const assert = require('assert');
const ApiAdapter = require('../adapters/api_adapter');
const CsvAdapter = require('../adapters/csv_adapter');
const IotAdapter = require('../adapters/iot_adapter');

async function runTests() {
    console.log('🧪 Starting Sensor & Environmental Data Adapter Layer Tests...');

    // 1. Test API Adapter with Normalization
    const api = new ApiAdapter();
    const apiRes = await api.ingest({ temperature: 77, tempUnit: 'F', humidity: 45.2, co2: 600 });
    assert.strictEqual(apiRes.metrics.temperature.value, 25);
    assert.strictEqual(apiRes.metrics.temperature.unit, 'C');
    assert.strictEqual(apiRes.overallQuality, 'VALID');
    assert(apiRes.provenance.recordHash, 'Should have SHA-256 provenance hash');
    console.log('  ✅ 1. API Adapter correctly normalized Fahrenheit to Celsius with provenance hash');

    // 2. Test CSV Batch Adapter
    const csv = new CsvAdapter();
    const csvData = `temperature,humidity,co2\n22.5,50,420\n150,99,25000`;
    const batch = await csv.ingest(csvData);
    assert.strictEqual(batch.length, 2);
    assert.strictEqual(batch[0].overallQuality, 'VALID');
    assert.strictEqual(batch[1].overallQuality, 'OUTLIER');
    console.log('  ✅ 2. CSV Adapter parsed records and successfully caught outlier data points');

    // 3. Test IoT Telemetry Adapter
    const iot = new IotAdapter('NODE_ORTO_01');
    const iotRes = await iot.ingest({ deviceId: 'ESP32_01', t: 21.0, h: 62.0, c: 450 });
    assert.strictEqual(iotRes.provenance.deviceId, 'ESP32_01');
    assert.strictEqual(iotRes.metrics.humidity.value, 62.0);
    console.log('  ✅ 3. IoT Telemetry packet successfully ingested and provenance tracked');

    console.log('🎉 All 3 Demo Adapters and Normalization Tests passed 100%!');
}

runTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
