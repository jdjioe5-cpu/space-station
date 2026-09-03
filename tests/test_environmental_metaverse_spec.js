const assert = require('assert');
const fs = require('fs');
const path = require('path');

async function testSpecIntegrity() {
    console.log('🧪 Starting Environmental Metaverse Specification (v0.1) Tests...');

    const specPath = path.join(__dirname, '../MYZ_ENVIRONMENTAL_METAVERSE_SPEC.md');
    assert(fs.existsSync(specPath), 'Specification file must exist');

    const content = fs.readFileSync(specPath, 'utf8');

    // 1. Verify Version and Status
    assert(content.includes('Version:** 0.1.0'), 'Must contain version 0.1.0');
    assert(content.includes('Status:** Architecture Baseline'), 'Must contain status baseline');
    console.log('  ✅ 1. Specification version and baseline status confirmed');

    // 2. Verify Mermaid Architecture Diagram
    assert(content.includes('```mermaid'), 'Must include mermaid architectural diagram');
    assert(content.includes('DataIngestion') && content.includes('MRVCore'), 'Architecture must define Data Ingestion and MRV Core layers');
    console.log('  ✅ 2. Architectural diagram and layer transitions verified');

    // 3. Verify Evidence Taxonomy
    const expectedTiers = ['demo', 'user-reported', 'sensor-backed', 'partner-validated'];
    expectedTiers.forEach(tier => {
        assert(content.includes(`\`${tier}\``), `Taxonomy must specify tier: ${tier}`);
    });
    console.log('  ✅ 3. Evidence taxonomy covers all 4 regulatory tiers');

    // 4. Verify Roles and Permission Matrix
    const expectedRoles = ['Participant', 'Issuer', 'Entity / NPC', 'Validator', 'Partner', 'Auditor'];
    expectedRoles.forEach(role => {
        assert(content.includes(role), `Roles matrix must include: ${role}`);
    });
    console.log('  ✅ 4. Role-based permission matrix verified across all 6 actor classes');

    // 5. Verify Differentiators
    assert(content.includes('Differentiators Against Legacy Carbon Markets'), 'Must document market differentiators');
    assert(content.includes('Verra / Gold Standard'), 'Must reference legacy standards');
    console.log('  ✅ 5. Market differentiators and legacy benchmark verified');

    console.log('🎉 Environmental Metaverse Specification tests passed 100%!');
}

testSpecIntegrity().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
