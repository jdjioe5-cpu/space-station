const assert = require('assert');
const { LifeWaterDashboard } = require('../mrv/life_water_dashboard');

async function runDashboardTests() {
    console.log('🧪 Starting LIFE Water Pilot Dashboard Tests (P0.6)...');

    // Dynamic API Payload from Sprint 1 MRV run
    const mockApiResponse = {
        pilotId: 'LIFE_WATER_ORTO_BOTANICO_PILOT_01',
        isSynthetic: true,
        baselineConsumptionM3: 4.000,
        interventionConsumptionM3: 2.660,
        reusedWaterM3: 0.580,
        dataQualityScorePercentage: 75.0,
        anomaliesCount: 2,
        provenanceHash: '0x3a82f9b1c0d4e5f678901234567890123456789012345678901234567890abcd'
    };

    const dashboard = new LifeWaterDashboard();

    // 1. Dynamic API Loading (Ensure zero hardcoded values)
    dashboard.loadApiData(mockApiResponse);
    const metrics = dashboard.aggregateMetrics('2026-08-01_to_2026-08-31');

    // 2. Exact mathematical consistency with MRV API
    assert.strictEqual(metrics.pilotId, 'LIFE_WATER_ORTO_BOTANICO_PILOT_01');
    assert.strictEqual(metrics.datasetType, 'SYNTHETIC');
    assert.strictEqual(metrics.waterSavedM3, 1.34);
    assert.strictEqual(metrics.waterSavedPercentage, 33.5);
    assert.strictEqual(metrics.totalEffectiveSavingsM3, 1.92);
    assert.strictEqual(metrics.dataQualityScore, 75.0);
    assert.strictEqual(metrics.warnings.length, 1);
    console.log('  ✅ 1. Dynamic API metrics loaded and verified matching MRV calculations (33.5% saved, 1.92 m³ total)');

    // 3. Evidence Drill-Down Integrity
    assert.strictEqual(metrics.evidenceRootHash, mockApiResponse.provenanceHash);
    console.log(`  ✅ 2. Cryptographic evidence root linked successfully: ${metrics.evidenceRootHash.substring(0, 18)}...`);

    // 4. Responsive HTML View Rendering
    const html = dashboard.renderHtmlView(metrics);
    assert(html.includes('LIFE Water Pilot Demonstrator'));
    assert(html.includes('STATUS: SYNTHETIC'));
    assert(html.includes('33.5%'));
    assert(html.includes('1.92 m³'));
    assert(html.includes(mockApiResponse.provenanceHash));
    console.log('  ✅ 3. Responsive HTML Dashboard view generated with active state badges and evidence links');

    console.log('🎉 All LIFE Water Pilot Dashboard tests passed 100% with full Definition-of-Done!');
}

runDashboardTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
