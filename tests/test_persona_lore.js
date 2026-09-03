const assert = require('assert');
const PersonaLoreBuilder = require('../identity/persona_lore_builder');

async function runLoreTests() {
    console.log('🧪 Starting Persona Lore Builder Tests...');

    const builder = new PersonaLoreBuilder();

    // 1. Initial Lore Creation
    const loreV1 = builder.saveLore('COMMANDER_SHEP', {
        biography: 'Veteran explorer of the outer rim sectors.',
        originStory: 'Stationed on Arcos Orbital since the solar flare of 2088.',
        declaredSkills: ['NAVIGATION', 'ASTRO_BOTANY', 'PLASMA_WELDING'],
        personalityTraits: ['DISCIPLINED', 'ANALYTICAL'],
        interests: ['Hydroponics', 'Stellar Cartography']
    });
    assert.strictEqual(loreV1.version, 1);
    assert.strictEqual(loreV1.safetyStatus, 'CLEAN');
    assert.strictEqual(loreV1.declaredSkills.length, 3);
    console.log('  ✅ 1. Persona lore created (v1) with clean safety status');

    // 2. Lore Update & Revision Tracking (v2)
    const loreV2 = builder.saveLore('COMMANDER_SHEP', {
        biography: 'Senior Station Officer overseeing ecological bio-domes.',
        originStory: loreV1.originStory,
        declaredSkills: [...loreV1.declaredSkills, 'CANOPY_DIAGNOSTICS'],
        personalityTraits: loreV1.personalityTraits
    });
    assert.strictEqual(loreV2.version, 2);
    assert.strictEqual(builder.loreStore.get('COMMANDER_SHEP').revisions.length, 2);
    console.log('  ✅ 2. Lore updated to v2 with revision history recorded');

    // 3. Moderation & Safety Sanitization Trap
    const malicious = builder.saveLore('INFILTRATOR_X', {
        biography: 'Innocent bio-chemist <script>eval("steal")</script>',
        originStory: 'From Earth',
        declaredSkills: ['HACKING']
    });
    assert.strictEqual(malicious.safetyStatus, 'FLAGGED');
    assert(malicious.biography.includes('[MODERATED_CONTENT]'));
    console.log('  ✅ 3. Moderation filter trapped malicious payload and sanitized text');

    // 4. Public Persona View with Strict Skill vs Capability Segregation
    const publicView = builder.getPublicPersonaView('COMMANDER_SHEP', ['CAN_SUBMIT_ORTO_TELEMETRY']);
    assert.strictEqual(publicView.narrativeSkills.includes('ASTRO_BOTANY'), true);
    assert.strictEqual(publicView.verifiedCapabilities.includes('CAN_SUBMIT_ORTO_TELEMETRY'), true);
    assert.strictEqual(publicView.verifiedCapabilities.includes('ASTRO_BOTANY'), false);
    console.log('  ✅ 4. Public dossier verified: Declared narrative skills strictly segregated from verified capabilities');

    // 5. Visual Editor & Live Preview UI HTML Output
    const html = builder.renderEditorPreviewHtml('COMMANDER_SHEP');
    assert(html.includes('EDIT IDENTITY LORE [COMMANDER_SHEP]'));
    assert(html.includes('LIVE DOSSIER PREVIEW'));
    console.log('  ✅ 5. Cyberpunk visual editor & live preview UI HTML rendered');

    console.log('🎉 All Persona Lore Builder tests passed 100%!');
}

runLoreTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
