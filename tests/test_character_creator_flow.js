const assert = require('assert');
const CharacterCreatorFlow = require('../identity/character_creator_flow');

async function runCreatorFlowTests() {
    console.log('🧪 Starting Character Creator Visual Flow Tests...');

    const flow = new CharacterCreatorFlow();

    // 1. Initialize Session in START state
    const session = flow.startSession('TEST_PILOT_01');
    assert.strictEqual(session.currentStep, 'START');
    assert.strictEqual(session.status, 'DRAFT');
    console.log('  ✅ 1. Session started in DRAFT state at step START');

    // 2. Sequential Step Transitions through the 7-Step Pipeline
    flow.nextStep('TEST_PILOT_01', { archetype: 'ORBITAL_TECH' }); // -> ARCHETYPE
    assert.strictEqual(session.currentStep, 'ARCHETYPE');
    assert.strictEqual(session.data.archetype, 'ORBITAL_TECH');

    flow.nextStep('TEST_PILOT_01', { visualFamily: 'CYBERPUNK' }); // -> APPEARANCE
    assert.strictEqual(session.currentStep, 'APPEARANCE');

    flow.nextStep('TEST_PILOT_01', { layers: { hair: 'CYBER_DREADS', outfit: 'ARMOR_TITAN' } }); // -> STYLE
    assert.strictEqual(session.currentStep, 'STYLE');

    flow.nextStep('TEST_PILOT_01', { displayName: 'Kaelen Voss', handle: 'kaelen_voss' }); // -> IDENTITY_DETAILS
    assert.strictEqual(session.currentStep, 'IDENTITY_DETAILS');
    assert.strictEqual(session.data.displayName, 'Kaelen Voss');

    flow.nextStep('TEST_PILOT_01'); // -> PREVIEW
    assert.strictEqual(session.currentStep, 'PREVIEW');
    console.log('  ✅ 2. Successfully transitioned through 7-step sequence with state persistence');

    // 3. Jump to Specific Step (Back navigation)
    flow.goToStep('TEST_PILOT_01', 'STYLE');
    assert.strictEqual(session.currentStep, 'STYLE');
    flow.goToStep('TEST_PILOT_01', 'PREVIEW');
    assert.strictEqual(session.currentStep, 'PREVIEW');
    console.log('  ✅ 3. Step jump and backward/forward navigation verified');

    // 4. Confirm & Publish
    const result = flow.confirmAndPublish('TEST_PILOT_01');
    assert.strictEqual(result.status, 'PUBLISHED');
    assert(result.characterId.startsWith('myz:char:'));
    console.log(`  ✅ 4. Character confirmed and published: ${result.characterId}`);

    // 5. Export JSON Configuration Bundle
    const bundle = flow.exportConfigBundle('TEST_PILOT_01');
    assert.strictEqual(bundle.identityProfile.displayName, 'Kaelen Voss');
    assert.strictEqual(bundle.visualConfig.archetype, 'ORBITAL_TECH');
    console.log('  ✅ 5. Synchronized JSON configuration bundle exported successfully');

    // 6. Responsive Wireframe HTML Component Rendering
    const html = flow.renderWizardWireframeHtml('TEST_PILOT_01');
    assert(html.includes('CHARACTER CREATOR'));
    assert(html.includes('Kaelen Voss'));
    console.log('  ✅ 6. Mobile-first cyber wizard HTML wireframe rendered');

    console.log('🎉 All Character Creator Visual Flow tests passed 100%!');
}

runCreatorFlowTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
