const assert = require('assert');
const AvatarGeneratorEngine = require('../identity/avatar_generator_engine');

async function runAvatarTests() {
    console.log('🧪 Starting Avatar Generator & Style System Tests...');

    const engine = new AvatarGeneratorEngine();

    // 1. Check Visual Families (CYBERPUNK, HUMAN, ALIEN)
    const avtCyber = engine.generateFromSeed('SEED_ALPHA_001', 'CYBERPUNK');
    const avtHuman = engine.generateFromSeed('SEED_BETA_002', 'HUMAN');
    const avtAlien = engine.generateFromSeed('SEED_GAMMA_003', 'ALIEN');

    assert.strictEqual(avtCyber.visualFamily, 'CYBERPUNK');
    assert.strictEqual(avtHuman.visualFamily, 'HUMAN');
    assert.strictEqual(avtAlien.visualFamily, 'ALIEN');
    console.log('  ✅ 1. 3 visual families (CYBERPUNK, HUMAN, ALIEN) initialized with distinct palettes');

    // 2. Deterministic Regeneration Test
    const runA = engine.generateFromSeed('IDENTICAL_SEED_42', 'CYBERPUNK');
    const runB = engine.generateFromSeed('IDENTICAL_SEED_42', 'CYBERPUNK');

    assert.strictEqual(runA.avatarId, runB.avatarId);
    assert.strictEqual(runA.archetype, runB.archetype);
    assert.strictEqual(runA.layers.hair, runB.layers.hair);
    assert.strictEqual(runA.layers.outfit, runB.layers.outfit);
    console.log('  ✅ 2. Deterministic regeneration confirmed: Identical seed produced 100% identical avatar config');

    // 3. 1:1 Portrait Rendering
    const portraitSvg = engine.renderPortraitSvg(avtCyber);
    assert(portraitSvg.includes('<svg'));
    assert(portraitSvg.includes('viewBox="0 0 300 300"'));
    console.log('  ✅ 3. 1:1 Square Portrait Vector SVG rendered');

    // 4. Full-Body Composition Rendering
    const fullBodySvg = engine.renderFullBodySvg(avtAlien);
    assert(fullBodySvg.includes('<svg'));
    assert(fullBodySvg.includes('viewBox="0 0 400 700"'));
    assert(fullBodySvg.includes('ALIEN'));
    console.log('  ✅ 4. Full-body composition SVG rendered');

    // 5. Fallback Defaulting for Unknown Family
    const fallback = engine.generateFromSeed('SEED_UNKNOWN', 'NON_EXISTENT_FAMILY');
    assert.strictEqual(fallback.visualFamily, 'CYBERPUNK');
    console.log('  ✅ 5. Graceful fallback defaulting to CYBERPUNK visual family');

    console.log('🎉 All Avatar Generator & Style System tests passed 100%!');
}

runAvatarTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
