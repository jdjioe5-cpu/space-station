const assert = require('assert');
const dataset = require('../data/synthetic_water_dataset.json');
const { LifeWaterPipeline } = require('../mrv/life_e2e_pipeline');

async function runLifeE2eDemoTests() {
    console.log('🧪 Starting LIFE MVP Synthetic Water E2E Pipeline Tests...');

    // 1. Synthetic data safety assertion
    assert.strictEqual(dataset.isSynthetic, true);
    console.log('  ✅ 1. Synthetic dataset explicitly tagged with isSynthetic: true');

    const pipeline = new LifeWaterPipeline(dataset);

    // 2. Ingestion & QA/QC Normalization
    const norm = pipeline.ingestAndNormalize();
    assert.strictEqual(norm.baselineTotalLiters, 4000); // 1200 + 1450 + 1350
    assert.strictEqual(norm.interventionTotalLiters, 2660); // 850 + 920 + 890
    assert.strictEqual(norm.reusedTotalLiters, 580); // 300 + 280
    assert.strictEqual(norm.rejectedReadingsCount, 2); // 1 spike + 1 null
    console.log('  ✅ 2. Ingestion & QA/QC verified: 4000L baseline vs 2660L intervention, 2 anomalies isolated');

    // 3. Expected KPI Fixture Validation
    const kpis = pipeline.calculateKpis(norm);
    assert.strictEqual(kpis.isSynthetic, true);
    assert.strictEqual(kpis.waterSavedM3, 1.34); // (4000 - 2660) / 1000
    assert.strictEqual(kpis.waterSavedPercentage, 33.5); // 1340 / 4000 * 100
    assert.strictEqual(kpis.reusedWaterM3, 0.58);
    assert.strictEqual(kpis.totalEffectiveSavingsM3, 1.92); // 1.34 + 0.58
    assert.strictEqual(kpis.dataQualityScorePercentage, 75.0); // 6 valid / 8 total
    console.log(`  ✅ 3. Expected KPI fixtures matched: 33.5% water saved (1.34 m³), 0.58 m³ reused, total savings 1.92 m³`);

    // 4. Single Source of Truth Dashboard & Report Exporter
    const { report, dashboardView } = pipeline.generateDashboardAndReport(kpis);
    assert.strictEqual(report.isSynthetic, true);
    assert.strictEqual(report.metrics.waterSavedPercentage, 33.5);
    assert.strictEqual(dashboardView.cards[0].value, '33.5%');
    assert.strictEqual(report.provenanceHash, dashboardView.rootHash);
    console.log('  ✅ 4. Dashboard and Export confirmed deriving from identical cryptographic root hash');

    // 5. Lineage Cryptographic Verifiability
    assert.strictEqual(pipeline.provenanceChain.length, 2);
    assert.strictEqual(pipeline.provenanceChain[1].prevHash, pipeline.provenanceChain[0].signature);
    console.log('  ✅ 5. End-to-end cryptographic provenance chain verified intact');

    console.log('🎉 LIFE MVP Synthetic Water E2E Demo passed 100% with full Definition-of-Done!');
}

runLifeE2eDemoTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
