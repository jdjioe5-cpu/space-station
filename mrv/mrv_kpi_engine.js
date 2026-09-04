/**
 * 📊 LIFE MRV Engine & Environmental KPI Calculator
 * Resolves Issue #13 (P0.4 — MRV Engine & Environmental KPI Calculator)
 */
const crypto = require('crypto');

class MrvKpiEngine {
    constructor() {
        this.runs = new Map();
        this.formulaVersion = 'v1.0-life-water';
    }

    /**
     * Helper: compute SHA-256
     */
    computeHash(data) {
        return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    }

    /**
     * POST /indicators/calculate: Calculate water KPIs deterministically
     */
    calculateWaterKpis(payload) {
        if (!payload || !payload.pilotId) {
            throw new Error('Invalid payload: pilotId is required');
        }

        const baselineLiters = payload.baselineLiters || 0;
        const observations = payload.observations || [];
        const reuseObservations = payload.reusedObservations || [];
        const expectedIntervals = payload.expectedIntervals || (observations.length || 1);

        const calculationTrace = {
            formulaVersion: this.formulaVersion,
            evaluatedAt: new Date().toISOString(),
            steps: []
        };

        // 1. Calculate Water Consumed
        let validObsCount = 0;
        let totalQualityScore = 0;
        let totalConsumedLiters = 0;

        for (const obs of observations) {
            const quality = obs.qualityScore !== undefined ? obs.qualityScore : 1.0;
            totalQualityScore += quality;

            if (obs.status !== 'INVALID' && obs.flowRateLh !== undefined && obs.flowRateLh !== null) {
                validObsCount++;
                // Default step duration 1h if not specified
                const hours = obs.durationHours || 1;
                const volume = obs.flowRateLh * hours;
                totalConsumedLiters += volume;
            }
        }
        totalConsumedLiters = Number(totalConsumedLiters.toFixed(2));
        calculationTrace.steps.push({
            name: 'waterConsumed',
            formula: 'SUM(flowRateLh * durationHours)',
            value: totalConsumedLiters,
            unit: 'Liters'
        });

        // 2. Calculate Water Reused
        let totalReusedLiters = 0;
        for (const r of reuseObservations) {
            totalReusedLiters += (r.reusedVolumeLiters || 0);
        }
        totalReusedLiters = Number(totalReusedLiters.toFixed(2));
        calculationTrace.steps.push({
            name: 'waterReused',
            formula: 'SUM(reusedVolumeLiters)',
            value: totalReusedLiters,
            unit: 'Liters'
        });

        // 3. Water Saved = Reused + max(0, Baseline - Consumed)
        const baselineDelta = Math.max(0, baselineLiters - totalConsumedLiters);
        const totalSavedLiters = Number((totalReusedLiters + baselineDelta).toFixed(2));
        calculationTrace.steps.push({
            name: 'waterSaved',
            formula: 'waterReused + MAX(0, baselineLiters - waterConsumed)',
            value: totalSavedLiters,
            unit: 'Liters'
        });

        // 4. Reuse Rate = Reused / (Consumed + Reused) * 100%
        const totalThroughput = totalConsumedLiters + totalReusedLiters;
        const reuseRatePct = totalThroughput > 0 ? Number(((totalReusedLiters / totalThroughput) * 100).toFixed(2)) : 0;
        calculationTrace.steps.push({
            name: 'reuseRate',
            formula: '(waterReused / (waterConsumed + waterReused)) * 100',
            value: reuseRatePct,
            unit: '%'
        });

        // 5. Reduction vs Baseline = (Baseline - Consumed) / Baseline * 100%
        const reductionVsBaselinePct = baselineLiters > 0 
            ? Number((((baselineLiters - totalConsumedLiters) / baselineLiters) * 100).toFixed(2)) 
            : 0;
        calculationTrace.steps.push({
            name: 'reductionVsBaseline',
            formula: '((baselineLiters - waterConsumed) / baselineLiters) * 100',
            value: reductionVsBaselinePct,
            unit: '%'
        });

        // 6. Data Completeness
        const completenessPct = expectedIntervals > 0 
            ? Number(((validObsCount / expectedIntervals) * 100).toFixed(2)) 
            : 100;

        // 7. Decoupled Data Quality & Confidence Indicator
        const avgConfidence = observations.length > 0 
            ? Number((totalQualityScore / observations.length).toFixed(2)) 
            : 1.0;

        const kpis = {
            waterConsumedLiters: totalConsumedLiters,
            waterReusedLiters: totalReusedLiters,
            waterSavedLiters: totalSavedLiters,
            waterSavedM3: Number((totalSavedLiters / 1000).toFixed(3)),
            reuseRatePercentage: reuseRatePct,
            reductionVsBaselinePercentage: reductionVsBaselinePct,
            dataCompletenessPercentage: completenessPct,
            dataQualityConfidenceScore: avgConfidence
        };

        const runId = `IND_${payload.pilotId}_${Date.now()}`;
        const inputProvenanceHashes = (observations.map(o => o.provenance_ref || o.hash)).filter(Boolean);

        const record = {
            id: runId,
            pilotId: payload.pilotId,
            period: payload.period || { start: '2026-08-15T00:00:00Z', end: '2026-08-15T23:59:59Z' },
            formulaVersion: this.formulaVersion,
            kpis,
            evidence: {
                calculationTrace,
                inputProvenanceHashes,
                baselineLiters,
                validObservationCount: validObsCount,
                expectedObservationCount: expectedIntervals
            },
            calculatedAt: new Date().toISOString()
        };

        record.signature = this.computeHash(record);
        this.runs.set(runId, record);
        return record;
    }

    /**
     * GET /indicators: List all indicator runs
     */
    listIndicators() {
        return Array.from(this.runs.values()).map(r => ({
            id: r.id,
            pilotId: r.pilotId,
            kpis: r.kpis,
            calculatedAt: r.calculatedAt,
            signature: r.signature
        }));
    }

    /**
     * GET /indicators/{id}/evidence: Retrieve full calculation trace & evidence
     */
    getEvidence(indicatorId) {
        const record = this.runs.get(indicatorId);
        if (!record) {
            throw new Error(`Indicator run ${indicatorId} not found`);
        }
        return {
            id: record.id,
            pilotId: record.pilotId,
            formulaVersion: record.formulaVersion,
            kpis: record.kpis,
            evidence: record.evidence,
            signature: record.signature
        };
    }

    /**
     * Export to Machine-Readable CSV
     */
    exportCsv(indicatorId) {
        const record = this.runs.get(indicatorId);
        if (!record) throw new Error(`Indicator run ${indicatorId} not found`);

        const headers = [
            'indicator_id',
            'pilot_id',
            'formula_version',
            'water_consumed_liters',
            'water_reused_liters',
            'water_saved_liters',
            'water_saved_m3',
            'reuse_rate_pct',
            'reduction_vs_baseline_pct',
            'data_completeness_pct',
            'data_quality_confidence',
            'calculated_at'
        ];

        const row = [
            record.id,
            record.pilotId,
            record.formulaVersion,
            record.kpis.waterConsumedLiters,
            record.kpis.waterReusedLiters,
            record.kpis.waterSavedLiters,
            record.kpis.waterSavedM3,
            record.kpis.reuseRatePercentage,
            record.kpis.reductionVsBaselinePercentage,
            record.kpis.dataCompletenessPercentage,
            record.kpis.dataQualityConfidenceScore,
            record.calculatedAt
        ];

        return `${headers.join(',')}\n${row.join(',')}`;
    }

    /**
     * Export to Machine-Readable JSON
     */
    exportJson(indicatorId) {
        const record = this.runs.get(indicatorId);
        if (!record) throw new Error(`Indicator run ${indicatorId} not found`);
        return JSON.stringify(record, null, 2);
    }
}

module.exports = {
    MrvKpiEngine
};
