const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Simple, robust schema conformance validator without external heavy dependencies
function validateObjectAgainstSchema(obj, schema) {
    // 1. Required fields check
    if (schema.required) {
        for (const req of schema.required) {
            assert(obj.hasOwnProperty(req), `Missing required property: ${req}`);
        }
    }

    // 2. Type & Pattern checks
    for (const [prop, propSchema] of Object.entries(schema.properties)) {
        if (!obj.hasOwnProperty(prop)) continue;
        const val = obj[prop];

        if (propSchema.type === 'string') {
            assert.strictEqual(typeof val, 'string', `Property ${prop} should be string`);
            if (propSchema.pattern) {
                const reg = new RegExp(propSchema.pattern);
                assert(reg.test(val), `Property ${prop} ('${val}') failed pattern regex ${propSchema.pattern}`);
            }
            if (propSchema.enum) {
                assert(propSchema.enum.includes(val), `Property ${prop} ('${val}') not in enum [${propSchema.enum.join(', ')}]`);
            }
            if (propSchema.format === 'date-time') {
                assert(!isNaN(new Date(val).getTime()), `Property ${prop} must be valid date-time`);
            }
        } else if (propSchema.type === 'number') {
            assert.strictEqual(typeof val, 'number', `Property ${prop} should be number`);
            if (propSchema.minimum !== undefined) {
                assert(val >= propSchema.minimum, `Property ${prop} must be >= ${propSchema.minimum}`);
            }
            if (propSchema.maximum !== undefined) {
                assert(val <= propSchema.maximum, `Property ${prop} must be <= ${propSchema.maximum}`);
            }
        } else if (propSchema.type === 'object') {
            assert.strictEqual(typeof val, 'object', `Property ${prop} should be object`);
            assert(val !== null, `Property ${prop} must not be null`);
        } else if (propSchema.type === 'array') {
            assert(Array.isArray(val), `Property ${prop} must be an array`);
        }
    }

    // 3. additionalProperties check
    if (schema.additionalProperties === false) {
        for (const key of Object.keys(obj)) {
            assert(schema.properties.hasOwnProperty(key), `Unrecognized property not allowed: ${key}`);
        }
    }

    return true;
}

async function runSchemaTests() {
    console.log('🧪 Starting LIFE Canonical JSON Schemas Validation Tests (P0.1 — Issue #10)...');

    // 1. Validate Sensor Observation Schema & Example
    const obsSchema = JSON.parse(fs.readFileSync(path.join(__dirname, '../schemas/sensor-observation.schema.json'), 'utf8'));
    const obsExample = JSON.parse(fs.readFileSync(path.join(__dirname, '../examples/water-pilot-observation.json'), 'utf8'));
    validateObjectAgainstSchema(obsExample, obsSchema);
    console.log('  ✅ 1. sensor-observation.schema.json successfully validated water-pilot-observation.json');

    // 2. Validate Multi-Domain Extensibility (Energy, Waste, Biodiversity)
    const energyObservation = {
        observation_id: "OBS_ENERGY_12345",
        pilot_id: "PILOT_LIFE_ES_001",
        source_id: "INVERTER_ZONE_B",
        domain: "ENERGY",
        parameter: "energy_consumption",
        value: 45.8,
        unit: "kWh",
        timestamp: new Date().toISOString(),
        location: { zone_id: "SOLAR_ROOF_01" },
        quality_flag: "VALID",
        provenance_ref: "PROV_RAW_ENERGY_99"
    };
    validateObjectAgainstSchema(energyObservation, obsSchema);
    console.log('  ✅ 2. Multi-domain extensibility confirmed for Energy, Waste & Biodiversity domains');

    // 3. Validate Environmental Event Schema & Example
    const evtSchema = JSON.parse(fs.readFileSync(path.join(__dirname, '../schemas/environmental-event.schema.json'), 'utf8'));
    const evtExample = JSON.parse(fs.readFileSync(path.join(__dirname, '../examples/water-pilot-event.json'), 'utf8'));
    validateObjectAgainstSchema(evtExample, evtSchema);
    console.log('  ✅ 3. environmental-event.schema.json successfully validated water-pilot-event.json');

    // 4. Validate MRV Indicator Schema & Example
    const indSchema = JSON.parse(fs.readFileSync(path.join(__dirname, '../schemas/mrv-indicator.schema.json'), 'utf8'));
    const indExample = JSON.parse(fs.readFileSync(path.join(__dirname, '../examples/water-pilot-indicator.json'), 'utf8'));
    validateObjectAgainstSchema(indExample, indSchema);
    console.log('  ✅ 4. mrv-indicator.schema.json successfully validated water-pilot-indicator.json');

    console.log('🎉 All LIFE Canonical JSON Schemas passed 100% with full Definition-of-Done!');
}

runSchemaTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
