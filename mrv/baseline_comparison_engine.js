/**
 * ⚖️ Baseline vs Intervention Comparison Engine
 * Resolves Issue #14 (P0.5 — Baseline vs Intervention Comparison Engine)
 */
const crypto = require('crypto');

class BaselineComparisonEngine {
    constructor() {
        this.baselines = new Map();
        this.comparisons = new Map();
    }

    /**
     * POST /baseline: Register or update a versioned environmental baseline
     */
    registerBaseline(baselineConfig) {
        if (!baselineConfig || !baselineConfig.pilotId || !baselineConfig.metrics) {
            throw new Error('Invalid baseline configuration: pilotId and metrics required');
        }

        const baselineId = baselineConfig.baselineId || `BASE_${baselineConfig.pilotId}_${Date.now()}`;
        const version = baselineConfig.version || 'v1.0-base';
        
        const record = {
            baselineId,
            pilotId: baselineConfig.pilotId,
            version,
            period: baselineConfig.period || { start: '2026-07-01T00:00:00Z', end: '2026-07-31T23:59:59Z' },
            metrics: baselineConfig.metrics, // e.g. { waterFlowMeanLh: 1333.33, totalLiters: 4000 }
            normalizingFactors: baselineConfig.normalizingFactors || { areaSquareMeters: 500, activeDays: 30 },
            registeredAt: new Date().toISOString()
        };

        record.hash = crypto.createHash('sha256').update(JSON.stringify(record)).digest('hex');
        this.baselines.set(baselineId, record);
        return record;
    }

    /**
     * POST /comparisons: Run deterministic comparison between intervention data and baseline
     */
    runComparison(interventionData, baselineId) {
        const baseline = this.baselines.get(baselineId);
        if (!baseline) {
            throw new Error(`Baseline ID ${baselineId} not found`);
        }

        const warnings = [];
        // Comparable Period Check
        if (interventionData.period && baseline.period) {
            const baseDur = new Date(baseline.period.end) - new Date(baseline.period.start);
            const intDur = new Date(interventionData.period.end) - new Date(interventionData.period.start);
            const ratio = intDur / (baseDur || 1);
            if (ratio < 0.5 || ratio > 2.0) {
                warnings.push(`Observation duration mismatch: intervention period is ${ratio.toFixed(2)}x of baseline.`);
            }
        }

        const baseTotal = baseline.metrics.totalLiters || 0;
        const intTotal = interventionData.metrics.totalLiters || 0;
        const absDeltaLiters = Number((baseTotal - intTotal).toFixed(2));
        const pctDelta = baseTotal > 0 ? Number(((absDeltaLiters / baseTotal) * 100).toFixed(2)) : 0;

        // Normalized metrics (e.g. liters saved per square meter)
        const area = baseline.normalizingFactors.areaSquareMeters || 1;
        const normalizedSavedPerM2 = Number((absDeltaLiters / area).toFixed(2));

        const comparisonId = `CMP_${baseline.pilotId}_${Date.now()}`;
        const result = {
            comparisonId,
            pilotId: baseline.pilotId,
            baselineRef: { id: baseline.baselineId, version: baseline.version, hash: baseline.hash },
            interventionPeriod: interventionData.period,
            kpis: {
                baselineConsumptionLiters: baseTotal,
                interventionConsumptionLiters: intTotal,
                absoluteDeltaLiters: absDeltaLiters,
                percentageSavings: pctDelta,
                waterSavedM3: Number((absDeltaLiters / 1000).toFixed(3)),
                normalizedSavingsPerM2: normalizedSavedPerM2,
                unit: 'Liters'
            },
            warnings,
            status: warnings.length > 0 ? 'COMPARABLE_WITH_WARNINGS' : 'VERIFIED_COMPARABLE',
            comparedAt: new Date().toISOString()
        };

        result.provenanceHash = crypto.createHash('sha256').update(JSON.stringify(result)).digest('hex');
        this.comparisons.set(comparisonId, result);
        return result;
    }

    /**
     * GET /comparisons/{id}: Retrieve verifiable comparison
     */
    getComparison(comparisonId) {
        const res = this.comparisons.get(comparisonId);
        if (!res) throw new Error(`Comparison ${comparisonId} not found`);
        return res;
    }
}

module.exports = {
    BaselineComparisonEngine
};
