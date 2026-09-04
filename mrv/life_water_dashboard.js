/**
 * 🎛️ LIFE Water Pilot Dashboard Engine
 * Resolves Issue #15 (P0.6 — LIFE Water Pilot Dashboard)
 */
const crypto = require('crypto');

class LifeWaterDashboard {
    constructor(apiData = null) {
        this.dataset = apiData;
    }

    /**
     * Ingests dynamic MRV API response (No hardcoding)
     */
    loadApiData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Valid dynamic API dataset must be supplied');
        }
        this.dataset = data;
    }

    /**
     * Aggregates pilot analytics from dynamic dataset
     */
    aggregateMetrics(period = 'ALL') {
        if (!this.dataset) {
            throw new Error('No API data loaded');
        }

        const baselineM3 = this.dataset.baselineConsumptionM3 || 0;
        const interventionM3 = this.dataset.interventionConsumptionM3 || 0;
        const waterSavedM3 = Number((baselineM3 - interventionM3).toFixed(3));
        const waterSavedPct = baselineM3 > 0 ? Number(((waterSavedM3 / baselineM3) * 100).toFixed(1)) : 0;
        const reusedM3 = this.dataset.reusedWaterM3 || 0;
        const totalEffectiveSavingsM3 = Number((waterSavedM3 + reusedM3).toFixed(3));
        const reuseRatePct = interventionM3 > 0 ? Number(((reusedM3 / (interventionM3 + reusedM3)) * 100).toFixed(1)) : 0;

        const summary = {
            pilotId: this.dataset.pilotId || 'PILOT_DEFAULT',
            datasetType: this.dataset.isSynthetic ? 'SYNTHETIC' : 'PILOT',
            period,
            baselineConsumptionM3: baselineM3,
            interventionConsumptionM3: interventionM3,
            waterSavedM3,
            waterSavedPercentage: waterSavedPct,
            reusedWaterM3: reusedM3,
            reuseRatePercentage: reuseRatePct,
            totalEffectiveSavingsM3,
            dataQualityScore: this.dataset.dataQualityScorePercentage || 100.0,
            evidenceRootHash: this.dataset.provenanceHash || crypto.createHash('sha256').update(JSON.stringify(this.dataset)).digest('hex'),
            warnings: this.dataset.anomaliesCount ? [`Detected ${this.dataset.anomaliesCount} isolated QA/QC telemetry spikes.`] : []
        };

        return summary;
    }

    /**
     * Renders responsive HTML/SVG Dashboard view
     */
    renderHtmlView(metrics) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LIFE Water Pilot Dashboard</title>
    <style>
        :root { --bg: #0b1329; --card: #162447; --accent: #00d2d3; --text: #e0e6ed; --alert: #ff9f43; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 20px; }
        .dashboard-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1f4068; padding-bottom: 15px; }
        .tag { padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 12px; }
        .tag-synthetic { background: #5f27cd; color: #fff; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 15px; margin-top: 20px; }
        .card { background: var(--card); padding: 20px; border-radius: 8px; border: 1px solid #1f4068; }
        .card h3 { margin: 0 0 10px 0; font-size: 14px; color: #8395a7; }
        .card .value { font-size: 28px; font-weight: bold; color: var(--accent); }
        .evidence-box { margin-top: 25px; background: #1a1a2e; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 13px; word-break: break-all; }
    </style>
</head>
<body>
    <div class="dashboard-header">
        <div>
            <h1 style="margin:0; font-size: 24px;">🌊 LIFE Water Pilot Demonstrator</h1>
            <small>Pilot ID: ${metrics.pilotId} | Period: ${metrics.period}</small>
        </div>
        <div>
            <span class="tag tag-synthetic">STATUS: ${metrics.datasetType}</span>
        </div>
    </div>

    <div class="grid">
        <div class="card">
            <h3>Direct Water Saved</h3>
            <div class="value">${metrics.waterSavedPercentage}%</div>
            <small>${metrics.waterSavedM3} m³ saved vs baseline</small>
        </div>
        <div class="card">
            <h3>Greywater Reused</h3>
            <div class="value">${metrics.reusedWaterM3} m³</div>
            <small>Circular Reuse Rate: ${metrics.reuseRatePercentage}%</small>
        </div>
        <div class="card">
            <h3>Total Effective Savings</h3>
            <div class="value">${metrics.totalEffectiveSavingsM3} m³</div>
            <small>Direct + Recycled aggregate</small>
        </div>
        <div class="card">
            <h3>QA/QC Quality Score</h3>
            <div class="value">${metrics.dataQualityScore}%</div>
            <small>${metrics.warnings.length} active warnings</small>
        </div>
    </div>

    <div class="evidence-box">
        <strong>🔒 Cryptographic Provenance Root:</strong><br>
        <code>${metrics.evidenceRootHash}</code>
    </div>
</body>
</html>`;
    }
}

module.exports = {
    LifeWaterDashboard
};
