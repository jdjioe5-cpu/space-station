const assert = require('assert');
const MrvCoreEngine = require('../mrv/mrv_core_engine');

async function runMrvTests() {
    console.log('🧪 Starting Environmental MRV Core & Provenance Tests...');

    const engine = new MrvCoreEngine();

    // 1. Create Evidence Package 1
    const pkg1 = engine.createEvidencePackage({
        packageId: 'MRV_PKG_001',
        claimRef: 'CLAIM_ECO_101',
        zoneId: 'ZONE_ORTO_ROME',
        observations: [
            { observationId: 'OBS_01', metrics: { temperature: 21.5, humidity: 62.0, co2: 410 }, qualityFlags: [] }
        ]
    });
    assert.strictEqual(pkg1.packageId, 'MRV_PKG_001');
    assert.strictEqual(pkg1.status, 'COLLECTED');
    assert(pkg1.provenanceHash.length === 64);
    assert.strictEqual(pkg1.prevHash, 'GENESIS_EVIDENCE_BLOCK');
    console.log(`  ✅ 1. First MRV evidence package created with genesis linkage [${pkg1.provenanceHash.substring(0, 16)}...]`);

    // 2. Create Evidence Package 2 (Chained)
    const pkg2 = engine.createEvidencePackage({
        packageId: 'MRV_PKG_002',
        claimRef: 'CLAIM_ECO_102',
        zoneId: 'TRENTINO_ALPINE_01',
        observations: [
            { observationId: 'OBS_02', metrics: { temperature: 15.0, humidity: 75.0, co2: 395 }, qualityFlags: [] }
        ]
    });
    assert.strictEqual(pkg2.prevHash, pkg1.blockHash);
    console.log('  ✅ 2. Second MRV evidence package successfully linked into cryptographic provenance chain');

    // 3. Verify Package Integrity
    const verification = engine.verifyEvidencePackage('MRV_PKG_001');
    assert.strictEqual(verification.isValid, true);
    assert.strictEqual(verification.status, 'HASH_VERIFIED');
    console.log('  ✅ 3. SHA-256 provenance hash integrity verified (state=HASH_VERIFIED)');

    console.log('🎉 All Environmental MRV Core & Provenance tests passed 100%!');
}

runMrvTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
