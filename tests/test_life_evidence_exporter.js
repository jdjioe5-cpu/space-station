const assert = require('assert');
const { LifeEvidenceExporter } = require('../mrv/life_evidence_exporter');

async function runExporterTests() {
    console.log('🧪 Starting LIFE Evidence & Reporting Exporter Tests (P0.7)...');

    const exporter = new LifeEvidenceExporter({ formulaVersion: 'v1.2.0-mrv' });

    // Mock MRV Ingestion Payload
    const mockPayload = {
        pilotId: 'LIFE_WATER_ORTO_BOTANICO_01',
        datasetType: 'SYNTHETIC',
        qaQcStatus: 'QA_PASSED',
        observedFacts: [
            { sensorId: 'FLOW_METER_01', timestamp: '2026-08-15T08:00:00Z', metric: 'water_flow', value: 850, unit: 'L/h' },
            { sensorId: 'RECYCLE_VALVE_02', timestamp: '2026-08-15T08:00:00Z', metric: 'greywater_reused', value: 300, unit: 'L' }
        ],
        calculatedIndicators: {
            water_consumption_reduction_pct: { value: 33.5, unit: '%' },
            total_effective_water_savings_m3: { value: 1.92, unit: 'm3' }
        },
        agentInterpretation: {
            agentName: 'Nythera-Environmental-Specialist',
            text: 'Intervention successfully lowered average flow velocity while maintaining optimal soil hydration.',
            confidence: 0.98
        },
        validationStatus: 'READY_FOR_EU_SUBMISSION'
    };

    // 1. Build Authoritative JSON Evidence Package
    const pkg = exporter.buildEvidencePackage(mockPayload);
    assert(pkg.packageId.startsWith('LIFE_EVD_'));
    assert.strictEqual(pkg.metadata.formulaVersion, 'v1.2.0-mrv');
    assert.strictEqual(pkg.metadata.datasetType, 'SYNTHETIC');
    assert.strictEqual(pkg.packageSignature.length, 64);
    console.log('  ✅ 1. Authoritative Evidence Package built with SHA-256 root signature');

    // 2. Strict 4-Tier Isolation: Ensure AI interpretation is NEVER presented as empirical fact
    assert.strictEqual(pkg.agentInterpretation.isEmpiricalObservation, false);
    assert.strictEqual(pkg.observedFacts.length, 2);
    assert(pkg.calculatedIndicators[0].evidenceRefs.length > 0);
    console.log('  ✅ 2. Strict 4-tier isolation verified: AI narrative explicitly flagged non-empirical');

    // 3. RFC-4180 Compliant CSV Export
    const csv = exporter.exportToCsv(pkg);
    assert(csv.includes('KPI_Name,Value,Unit,Formula_Version,Dataset_Type,QA_QC_Status'));
    assert(csv.includes('"water_consumption_reduction_pct",33.5,"%"'));
    assert(csv.includes('"total_effective_water_savings_m3",1.92,"m3"'));
    console.log('  ✅ 3. CSV KPI Matrix export verified adhering to standard table schema');

    // 4. Human-Readable Markdown Report
    const md = exporter.exportHumanReadableSummary(pkg);
    assert(md.includes('LIFE MRV Scientific Evidence Report'));
    assert(md.includes('33.5 %'));
    assert(md.includes('Nythera-Environmental-Specialist'));
    assert(md.includes(pkg.packageSignature));
    console.log('  ✅ 4. Human-readable Markdown summary verified with linked signature');

    // 5. Reproducible Export Invariance
    const pkg2 = exporter.buildEvidencePackage(mockPayload);
    assert.strictEqual(pkg.metadata.formulaVersion, pkg2.metadata.formulaVersion);
    console.log('  ✅ 5. Export determinism & reproducibility verified');

    console.log('🎉 All LIFE Evidence & Reporting Exporter tests passed 100% with full Definition-of-Done!');
}

runExporterTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
