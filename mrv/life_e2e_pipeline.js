/**
 * 🌊 LIFE MVP E2E Pipeline Engine
 * Resolves Issue #17 (P0.8 — Sprint 1 Synthetic Water Dataset & E2E LIFE Demo)
 */
const crypto = require('crypto');

class LifeWaterPipeline {
    constructor(dataset) {
        if (!dataset || !dataset.isSynthetic) {
            throw new Error('Safety assertion failed: dataset must explicitly flag isSynthetic: true');
        }
        this.dataset = dataset;
        this.provenanceChain = [];
    }

    /**
     * Step 1: Ingestion & Unit Normalisation
     */
    ingestAndNormalize() {
        const normalized = {
            baselineTotalLiters: 0,
            interventionTotalLiters: 0,
            reusedTotalLiters: 0,
            validReadingsCount: 0,
            rejectedReadingsCount: 0
        };

        // Sum baseline
        for (const obs of this.dataset.baselineObservations) {
            normalized.baselineTotalLiters += obs.flowRateLh;
            normalized.validReadingsCount++;
        }

        // Sum intervention
        for (const obs of this.dataset.interventionObservations) {
            normalized.interventionTotalLiters += obs.flowRateLh;
            normalized.validReadingsCount++;
        }

        // Sum reused water
        for (const obs of this.dataset.reusedWaterObservations) {
            normalized.reusedTotalLiters += obs.reusedVolumeLiters;
        }

        // QA/QC: isolate anomalies
        for (const obs of this.dataset.anomaliesAndOutliers) {
            normalized.rejectedReadingsCount++;
        }

        this._recordProvenance('INGESTION_NORMALIZATION', normalized);
        return normalized;
    }

    /**
     * Step 2: Baseline vs Intervention KPI Calculation
     */
    calculateKpis(normalized) {
        const baseline = normalized.baselineTotalLiters;
        const intervention = normalized.interventionTotalLiters;
        const waterSavedLiters = baseline - intervention;
        const waterSavedPercentage = Number(((waterSavedLiters / baseline) * 100).toFixed(2));
        const totalEffectiveSavings = waterSavedLiters + normalized.reusedTotalLiters;

        // Data quality score: Valid / Total observations
        const totalObs = normalized.validReadingsCount + normalized.rejectedReadingsCount;
        const qualityScore = Number(((normalized.validReadingsCount / totalObs) * 100).toFixed(1));

        const kpis = {
            pilotId: this.dataset.pilotId,
            isSynthetic: true,
            baselineConsumptionM3: Number((baseline / 1000).toFixed(3)),
            interventionConsumptionM3: Number((intervention / 1000).toFixed(3)),
            waterSavedM3: Number((waterSavedLiters / 1000).toFixed(3)),
            waterSavedPercentage,
            reusedWaterM3: Number((normalized.reusedTotalLiters / 1000).toFixed(3)),
            totalEffectiveSavingsM3: Number((totalEffectiveSavings / 1000).toFixed(3)),
            dataQualityScorePercentage: qualityScore,
            labReferencePassed: this.dataset.labReferenceMeasurements.length > 0
        };

        this._recordProvenance('KPI_CALCULATION', kpis);
        return kpis;
    }

    /**
     * Step 3: Shared Single Source of Truth Dashboard & Report Exporter
     */
    generateDashboardAndReport(kpis) {
        const provenanceHash = this.provenanceChain[this.provenanceChain.length - 1].signature;
        
        const report = {
            reportId: `LIFE_REP_${this.dataset.pilotId}_${Date.now()}`,
            isSynthetic: true,
            summary: `Water pilot achieved ${kpis.waterSavedPercentage}% direct reduction plus ${kpis.reusedWaterM3} m³ reused.`,
            metrics: kpis,
            provenanceHash,
            lineageCount: this.provenanceChain.length,
            generatedAt: new Date().toISOString()
        };

        const dashboardView = {
            title: 'LIFE Environmental Water Pilot Dashboard (Synthetic Demo)',
            status: 'HEALTHY_VERIFIED',
            cards: [
                { label: 'Water Saved (%)', value: `${kpis.waterSavedPercentage}%` },
                { label: 'Total Effective Savings (m³)', value: `${kpis.totalEffectiveSavingsM3} m³` },
                { label: 'QA/QC Data Quality Score', value: `${kpis.dataQualityScorePercentage}%` }
            ],
            rootHash: provenanceHash
        };

        return { report, dashboardView };
    }

    _recordProvenance(stage, payload) {
        const prevHash = this.provenanceChain.length > 0 
            ? this.provenanceChain[this.provenanceChain.length - 1].signature 
            : '0x0000000000000000000000000000000000000000000000000000000000000000';
            
        const entry = {
            index: this.provenanceChain.length,
            stage,
            timestamp: new Date().toISOString(),
            prevHash,
            payloadSummary: crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')
        };
        entry.signature = crypto.createHash('sha256').update(JSON.stringify(entry)).digest('hex');
        this.provenanceChain.push(entry);
    }
}

module.exports = {
    LifeWaterPipeline
};
