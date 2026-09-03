const assert = require('assert');
const MetaverseMissionEngine = require('../missions/metaverse_mission_engine');

async function runMissionTests() {
    console.log('🧪 Starting Metaverse Missions & Quests Tests...');

    const engine = new MetaverseMissionEngine();

    // 1. Create Cooperative Environmental Mission
    const mission = engine.createMission({
        missionId: 'MSN_COOP_CANOPY',
        title: 'Orto Botanico Cooperative Canopy Audit',
        missionType: 'COOPERATIVE_CHALLENGE',
        npcHost: 'NPC_PYTHO_GUARDIAN',
        lifeEvidenceTier: 'SENSOR_BACKED',
        targetGoal: 200,
        rewards: { myz: 100, xp: 400 }
    });
    assert.strictEqual(mission.status, 'ACTIVE');
    console.log('  ✅ 1. Cooperative environmental mission registered with Pytho NPC host');

    // 2. Multiplayer Team Joining
    engine.joinMission('MSN_COOP_CANOPY', 'AGENT_ALICE');
    const team = engine.joinMission('MSN_COOP_CANOPY', 'AGENT_BOB');
    assert.strictEqual(team.teamSize, 2);
    console.log('  ✅ 2. Multi-user cooperative team formed (teamSize=2)');

    // 3. Collaborative Progress Contribution
    engine.contributeProgress('MSN_COOP_CANOPY', 'AGENT_ALICE', 120);
    const progress = engine.contributeProgress('MSN_COOP_CANOPY', 'AGENT_BOB', 90);
    assert.strictEqual(progress.totalTeamProgress, 210);
    assert.strictEqual(progress.isCompleted, true);
    console.log('  ✅ 3. Collaborative progress reached target goal (210/200, completed=true)');

    // 4. Test LIFE Evidence Boundary (Simulated vs Sensor-backed)
    assert.strictEqual(engine.canDisburseMYZ('MSN_COOP_CANOPY'), true);

    const demoMission = engine.createMission({
        missionId: 'MSN_DEMO_01',
        lifeEvidenceTier: 'SIMULATED'
    });
    assert.strictEqual(engine.canDisburseMYZ('MSN_DEMO_01'), false);
    console.log('  ✅ 4. LIFE regulatory boundary enforced: Simulated barred from MYZ rewards');

    // 5. Event Scheduling Window
    const now = Date.now();
    const scheduledMission = engine.createMission({
        missionId: 'MSN_SOLSTICE_FEST',
        startTime: new Date(now - 10000).toISOString(),
        endTime: new Date(now + 10000).toISOString()
    });
    assert.strictEqual(engine.isEventActive('MSN_SOLSTICE_FEST', now), true);
    assert.strictEqual(engine.isEventActive('MSN_SOLSTICE_FEST', now + 20000), false);
    console.log('  ✅ 5. Event scheduling window verified active/expired behavior');

    console.log('🎉 All Metaverse Missions & Quests tests passed 100%!');
}

runMissionTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
