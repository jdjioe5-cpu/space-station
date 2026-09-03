const assert = require('assert');
const LifePilotZoneEngine = require('../pilot/pilot_zone_engine');

async function runPilotTests() {
    console.log('🧪 Starting LIFE Metaverse Pilot Zone Tests...');

    const engine = new LifePilotZoneEngine({
        zoneId: 'ZONE_ORTO_ROME',
        zoneName: 'Orto Botanico Roma Twin'
    });

    // 1. Ingest Simulated Telemetry
    const simRecord = engine.ingestTelemetry({
        temperature: 24.5,
        humidity: 60,
        co2: 410,
        isVerifiedPhysical: false
    });
    assert.strictEqual(simRecord.dataMode, 'SIMULATED');
    console.log('  ✅ 1. Simulated data correctly labeled as SIMULATED');

    // 2. Ingest Verified Physical Telemetry
    const verRecord = engine.ingestTelemetry({
        temperature: 23.0,
        humidity: 65,
        co2: 400,
        isVerifiedPhysical: true
    });
    assert.strictEqual(verRecord.dataMode, 'VERIFIED_PHYSICAL');
    assert(verRecord.provenanceHash.length > 0);
    console.log('  ✅ 2. Hardware telemetry correctly labeled as VERIFIED_PHYSICAL with provenance hash');

    // 3. Compute MRV Status
    const mrv = engine.computeMrvStatus();
    assert.strictEqual(mrv.totalSamples, 2);
    assert.strictEqual(mrv.verifiedCount, 1);
    assert.strictEqual(mrv.verifiedRatio, 0.5);
    assert(['ACCREDITED', 'PENDING_VALIDATION'].includes(mrv.mrvStatus));
    console.log(`  ✅ 3. MRV Status calculated: status=[${mrv.mrvStatus}], score=[${mrv.score}]`);

    // 4. Verify Snapshot and NPC Guide
    const snapshot = engine.getZoneSnapshot();
    assert.strictEqual(snapshot.npcGuide.name, 'Pytho Entity Guardian');
    assert.strictEqual(snapshot.missionBoard.length, 2);
    console.log('  ✅ 4. Zone snapshot verified with NPC guide and active mission board');

    console.log('🎉 All LIFE Pilot Zone & Digital Twin tests passed 100%!');
}

runPilotTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
