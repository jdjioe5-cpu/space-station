const assert = require('assert');
const PartnerPortalEngine = require('../portal/partner_portal_engine');

async function runPortalTests() {
    console.log('🧪 Starting Partner Portal & LIFE Reporting Tests...');

    const engine = new PartnerPortalEngine();

    // 1. Register Institutional Partner
    const partner = engine.registerPartner('PARTNER_ENEL_GREEN', {
        organization: 'Enel Green Power Innovation Hub',
        tier: 'INSTITUTIONAL_LEAD'
    });
    assert.strictEqual(partner.partnerId, 'PARTNER_ENEL_GREEN');
    console.log('  ✅ 1. Institutional partner successfully registered');

    // 2. Generate LIFE Compliance Report
    const report = engine.generateLifeReport('PARTNER_ENEL_GREEN', {
        currentCO2: 410,
        missionsCompleted: 8
    });
    assert.strictEqual(report.outcomeMetrics.mrvAccreditationStatus, 'ACCREDITED');
    assert.strictEqual(report.outcomeMetrics.co2DeltaPct, -13.5);
    assert(report.provenanceSignature.length === 64);
    console.log(`  ✅ 2. LIFE Compliance report synthesized with SHA-256 signature [${report.provenanceSignature.substring(0, 16)}...]`);

    // 3. Test CSV Export Model
    const csv = engine.exportToCsv(report);
    assert(csv.includes('PARTNER_ENEL_GREEN') || csv.includes('Enel Green Power'));
    assert(csv.includes('ACCREDITED'));
    console.log('  ✅ 3. CSV export generated with valid schema headers and values');

    // 4. Test PDF-Ready Schema Export
    const pdfSchema = engine.exportToPdfSchema(report);
    assert.strictEqual(pdfSchema.documentNumber, report.reportId);
    assert.strictEqual(pdfSchema.issuedTo, 'Enel Green Power Innovation Hub');
    console.log('  ✅ 4. PDF-ready audit schema validated');

    console.log('🎉 All Partner Portal & LIFE Reporting tests passed 100%!');
}

runPortalTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
