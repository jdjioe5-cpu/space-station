const assert = require('assert');
const TerritorialReplicationEngine = require('../replication/territorial_replication_engine');

async function runReplicationTests() {
    console.log('🧪 Starting Territorial Replication & Scaling Tests...');

    const engine = new TerritorialReplicationEngine();

    // 1. Instantiate Alpine Territory
    const alpine = engine.instantiateTerritory({
        territoryId: 'TRENTINO_ALPINE_01',
        regionName: 'Trentino Alpine Botanical Reserve',
        partnerOrganization: 'Fondazione Foreste Alpine',
        kpiOverrides: { maxCO2Ppm: 420 }
    });
    assert.strictEqual(alpine.regionName, 'Trentino Alpine Botanical Reserve');
    assert.strictEqual(alpine.customKPIs.maxCO2Ppm, 420);
    assert(alpine.provenanceHash.length > 0);
    console.log('  ✅ 1. Alpine territorial replica successfully instantiated with custom CO2 KPI');

    // 2. Instantiate Mediterranean Agro-Ecological Territory
    const sicilia = engine.instantiateTerritory({
        territoryId: 'SICILIA_AGRITEC_02',
        regionName: 'Sicilia Agro-Ecological Park',
        partnerOrganization: 'Consorzio Agrumi Sostenibili'
    });
    assert.strictEqual(sicilia.customKPIs.maxCO2Ppm, 450); // uses default
    console.log('  ✅ 2. Mediterranean territorial replica instantiated using standard baseline');

    // 3. Multi-Territory Comparison Benchmarking
    const comparison = engine.compareTerritories();
    assert.strictEqual(comparison.totalReplicas, 2);
    assert.strictEqual(comparison.territories.length, 2);
    console.log(`  ✅ 3. Multi-territory benchmark synthesized across [${comparison.totalReplicas}] regional hubs`);

    console.log('🎉 All Territorial Replication & Scaling tests passed 100%!');
}

runReplicationTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
