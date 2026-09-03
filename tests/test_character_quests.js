const assert = require('assert');
const CharacterQuestEngine = require('../quests/character_quest_engine');

async function runQuestTests() {
    console.log('🧪 Starting Character Quests & Progression Tests...');

    const engine = new CharacterQuestEngine();

    // 1. Check Initial Profile
    const profile = engine.getProfile('CADET_VAL');
    assert.strictEqual(profile.level, 1);
    assert.strictEqual(profile.xp, 0);
    assert.strictEqual(profile.myzBalance, 0);
    console.log('  ✅ 1. Profile initialized (Level 1, 0 XP, 0 MYZ)');

    // 2. Complete Level 1 Avatar Quest
    const q1 = engine.completeQuest('CADET_VAL', 'Q_AVATAR');
    assert.strictEqual(q1.xpEarned, 50);
    assert.strictEqual(q1.myzEarned, 10);
    assert.strictEqual(profile.unlockedBadges.has('BADGE_STYLE_PIONEER'), true);
    console.log('  ✅ 2. Avatar quest completed: +50 XP, +10 MYZ, unlocked BADGE_STYLE_PIONEER');

    // 3. Complete Onboarding Quest and Level Up
    // Profile had 50 XP; Q_ONBOARDING gives 100 XP -> Total 150 XP -> Level = floor(sqrt(150/100)) + 1 = Level 2!
    const q2 = engine.completeQuest('CADET_VAL', 'Q_ONBOARDING');
    assert.strictEqual(q2.totalLevel, 2);
    assert.strictEqual(q2.leveledUp, true);
    assert.strictEqual(profile.unlockedCosmetics.has('SKIN_CADET_VISOR'), true);
    console.log('  ✅ 3. Onboarding completed: Level Up triggered to Level 2 and SKIN_CADET_VISOR unlocked');

    // 4. Sybil Check: Block duplicate quest completion
    assert.throws(() => {
        engine.completeQuest('CADET_VAL', 'Q_AVATAR');
    }, /already completed/);
    console.log('  ✅ 4. Duplicate quest completion safely blocked');

    // 5. Check Gated Quest Requirement (Level 3 Required for Q_LIFE_MRV)
    assert.throws(() => {
        engine.completeQuest('CADET_VAL', 'Q_LIFE_MRV'); // Requires Level 3, Cadet is Level 2
    }, /Level 3 required/);
    console.log('  ✅ 5. Level gate prevented premature quest entry');

    // 6. Complete Environmental Quest at Level 2
    const q3 = engine.completeQuest('CADET_VAL', 'Q_ECO_CONTRIB');
    assert.strictEqual(q3.myzEarned, 100);
    assert.strictEqual(profile.myzBalance, 135); // 10 + 25 + 100
    assert.strictEqual(profile.unlockedBadges.has('BADGE_GREEN_SCOUT'), true);
    console.log('  ✅ 6. Verifiable environmental quest completed: +100 MYZ disbursed & BADGE_GREEN_SCOUT unlocked');

    console.log('🎉 All Character Quests & Progression tests passed 100%!');
}

runQuestTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
