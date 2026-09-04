const assert = require('assert');
const { BaselineComparisonEngine } = require('../mrv/baseline_comparison_engine');
let syntheticDataset;
try {
    syntheticDataset = require('../data/synthetic_water_dataset.json');
} catch (e) {
    syntheticDataset = {
        pilotId: 'LIFE_PILOT_WATER_01',
        baselineObservations: [
            { flowRateLh: 1200 }, { flowRateLh: 1450 }, { flowRateLh: 1350 }
        ],
        interventionObservations: [
            { flowRateLh: 850 }, { flowRateLh: 920 }, { flowRateLh: 890 }
        ]
    };
}

async function runComparisonTests() {
    console.log('🧪 Starting Baseline vs Intervention Comparison Engine Tests (P0.5)...');

    const engine = new BaselineComparisonEngine();

    // 1. Configure and Version Baseline
    const baseline = engine.registerBaseline({
        pilotId: syntheticDataset.pilotId,
        version: 'v1.0-base-spring',
        period: { start: '2026-08-01T00:00:00Z', end: '2026-08-01T23:59:59Z' },
        metrics: {
            totalLiters: 4000,
            observationCount: syntheticDataset.baselineObservations.length
        },
        normalizingFactors: {
            areaSquareMeters: 500
        }
    });

    assert(baseline.baselineId.startsWith('BASE_'));
    assert.strictEqual(baseline.version, 'v1.0-base-spring');
    assert.strictEqual(baseline.hash.length, 64);
    console.log(`  ✅ 1. Configured & versioned baseline: ${baseline.baselineId} (${baseline.version})`);

    // 2. Run Comparison with Synthetic Intervention Data
    const interventionPayload = {
        period: { start: '2026-08-15T00:00:00Z', end: '2026-08-15T23:59:59Z' },
        metrics: {
            totalLiters: 2660,
            observationCount: syntheticDataset.interventionObservations.length
        }
    };

    const comparison = engine.runComparison(interventionPayload, baseline.baselineId);
    assert(comparison.comparisonId.startsWith('CMP_'));
    assert.strictEqual(comparison.kpis.baselineConsumptionLiters, 4000);
    assert.strictEqual(comparison.kpis.interventionConsumptionLiters, 2660);
    assert.strictEqual(comparison.kpis.absoluteDeltaLiters, 1340); // 4000 - 2660
    assert.strictEqual(comparison.kpis.percentageSavings, 33.5);   // 1340 / 4000 * 100
    assert.strictEqual(comparison.kpis.waterSavedM3, 1.34);
    assert.strictEqual(comparison.kpis.normalizedSavingsPerM2, 2.68); // 1340 / 500
    assert.strictEqual(comparison.status, 'VERIFIED_COMPARABLE');
    assert.strictEqual(comparison.provenanceHash.length, 64);
    console.log(`  ✅ 2. Quantitative comparison verified: 1340L (33.5%) saved, 2.68 L/m² normalized efficiency`);

    // 3. GET /comparisons/{id} endpoint check
    const fetched = engine.getComparison(comparison.comparisonId);
    assert.strictEqual(fetched.provenanceHash, comparison.provenanceHash);
    console.log('  ✅ 3. GET /comparisons/{id} retrieved identical reproducible record');

    // 4. Warning trigger on duration mismatch
    const skewedIntervention = {
        period: { start: '2026-08-15T00:00:00Z', end: '2026-08-18T23:59:59Z' }, // 4 days vs 1 day
        metrics: { totalLiters: 9000 }
    };
    const skewedResult = engine.runComparison(skewedIntervention, baseline.baselineId);
    assert.strictEqual(skewedResult.status, 'COMPARABLE_WITH_WARNINGS');
    assert(skewedResult.warnings.length > 0);
    console.log(`  ✅ 4. Comparability guard verified: Issued warning for duration skew (${skewedResult.warnings[0]})`);

    console.log('🎉 All Baseline vs Intervention Comparison Engine tests passed 100% with full Definition-of-Done!');
}

runComparisonTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
