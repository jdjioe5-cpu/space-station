const assert = require('assert');
const { MrvKpiEngine } = require('../mrv/mrv_kpi_engine');

async function runTestSuite() {
    console.log('🧪 Starting LIFE MRV Engine & KPI Calculator Tests (P0.4 — Issue #13)...');

    const engine = new MrvKpiEngine();

    // 1. Calculate water KPIs with validated dataset
    const payload = {
        pilotId: 'PILOT_WATER_LIFE_01',
        baselineLiters: 4000,
        expectedIntervals: 3,
        observations: [
            { flowRateLh: 850, durationHours: 1, qualityScore: 1.0, provenance_ref: 'PROV_RAW_001', status: 'VALID' },
            { flowRateLh: 920, durationHours: 1, qualityScore: 0.95, provenance_ref: 'PROV_RAW_002', status: 'VALID' },
            { flowRateLh: 890, durationHours: 1, qualityScore: 0.98, provenance_ref: 'PROV_RAW_003', status: 'VALID' }
        ],
        reusedObservations: [
            { reusedVolumeLiters: 300 },
            { reusedVolumeLiters: 280 }
        ]
    };

    const run = engine.calculateWaterKpis(payload);

    assert(run.id.startsWith('IND_PILOT_WATER_LIFE_01_'));
    assert.strictEqual(run.formulaVersion, 'v1.0-life-water');
    assert.strictEqual(run.kpis.waterConsumedLiters, 2660); // 850 + 920 + 890
    assert.strictEqual(run.kpis.waterReusedLiters, 580);    // 300 + 280
    assert.strictEqual(run.kpis.waterSavedLiters, 1920);   // 580 + (4000 - 2660)
    assert.strictEqual(run.kpis.waterSavedM3, 1.92);
    // Reuse rate: 580 / (2660 + 580) * 100 = 17.90%
    assert.strictEqual(run.kpis.reuseRatePercentage, 17.9);
    // Reduction vs baseline: (4000 - 2660) / 4000 * 100 = 33.5%
    assert.strictEqual(run.kpis.reductionVsBaselinePercentage, 33.5);
    assert.strictEqual(run.kpis.dataCompletenessPercentage, 100);
    assert.strictEqual(run.kpis.dataQualityConfidenceScore, 0.98);
    console.log('  ✅ 1. Water KPIs calculated deterministically with versioned v1.0 formula: 1,920L total saved (17.9% reuse, 33.5% reduction)');

    // 2. Decoupled Data Quality Check (Incomplete / Outlier dataset)
    const noisyPayload = {
        pilotId: 'PILOT_WATER_LIFE_02',
        baselineLiters: 1000,
        expectedIntervals: 4, // Expected 4 observations, but only 2 valid
        observations: [
            { flowRateLh: 500, durationHours: 1, qualityScore: 0.5, status: 'OUTLIER' },
            { flowRateLh: 500, durationHours: 1, qualityScore: 0.9, status: 'VALID' },
            { flowRateLh: null, durationHours: 1, qualityScore: 0.1, status: 'INVALID' }
        ]
    };
    const noisyRun = engine.calculateWaterKpis(noisyPayload);
    // 2 valid / 4 expected = 50%
    assert.strictEqual(noisyRun.kpis.dataCompletenessPercentage, 50);
    assert.strictEqual(noisyRun.kpis.dataQualityConfidenceScore, 0.5);
    console.log('  ✅ 2. Decoupled Data Quality & Completeness correctly separated from volume metrics');

    // 3. Evidence & Calculation Trace Retrieval (GET /indicators/{id}/evidence)
    const evidence = engine.getEvidence(run.id);
    assert.strictEqual(evidence.evidence.calculationTrace.steps.length, 5);
    assert.strictEqual(evidence.evidence.inputProvenanceHashes.length, 3);
    assert.strictEqual(evidence.evidence.inputProvenanceHashes[0], 'PROV_RAW_001');
    console.log('  ✅ 3. Evidence Endpoint (GET /indicators/{id}/evidence) returned full formula trace and provenance hashes');

    // 4. Export Machine-Readable JSON and CSV
    const csvExport = engine.exportCsv(run.id);
    assert(csvExport.includes('indicator_id,pilot_id,formula_version'));
    assert(csvExport.includes('PILOT_WATER_LIFE_01,v1.0-life-water,2660,580,1920'));
    
    const jsonExport = engine.exportJson(run.id);
    const parsedJson = JSON.parse(jsonExport);
    assert.strictEqual(parsedJson.id, run.id);
    console.log('  ✅ 4. JSON & CSV export formats validated with machine-readable schema');

    // 5. Determinism Verification
    const rerun = engine.calculateWaterKpis(payload);
    assert.strictEqual(rerun.kpis.waterConsumedLiters, run.kpis.waterConsumedLiters);
    assert.strictEqual(rerun.kpis.waterSavedLiters, run.kpis.waterSavedLiters);
    console.log('  ✅ 5. Deterministic reproducibility confirmed on identical input datasets');

    console.log('🎉 All LIFE MRV Engine & Environmental KPI Calculator tests passed 100% with full Definition-of-Done!');
}

runTestSuite().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
