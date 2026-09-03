const assert = require('assert');
const MetaverseBountyBoard = require('../board/metaverse_bounty_board');

async function runBoardTests() {
    console.log('🧪 Starting Metaverse Bounty Board Tests...');

    const board = new MetaverseBountyBoard();

    // 1. Register Global & Zone-specific Missions
    board.addMission({
        id: 'MISSION_GLOBAL_01',
        title: 'Global Satellite Telemetry Validation',
        zoneId: 'GLOBAL',
        rewards: { myz: 100, xp: 500, reputation: 25 }
    });
    board.addMission({
        id: 'MISSION_ROMA_01',
        title: 'Orto Botanico Soil Moisture Survey',
        zoneId: 'ZONE_ORTO_ROMA',
        rewards: { myz: 50, xp: 200, reputation: 10 }
    });
    console.log('  ✅ 1. Global & Zone missions successfully registered');

    // 2. Test Filtering by Zone
    const globalMissions = board.getMissions();
    assert.strictEqual(globalMissions.length, 2);

    const romaMissions = board.getMissions({ zoneId: 'ZONE_ORTO_ROMA' });
    assert.strictEqual(romaMissions.length, 2); // Includes zone + global
    console.log('  ✅ 2. Dual-scope global and zone-specific filtering verified');

    // 3. Test Claim & Proof Submission Flow
    const claim = board.claimMission('MISSION_ROMA_01', 'USER_OPERATOR_007');
    assert.strictEqual(claim.stage, 'IN_PROGRESS');
    assert.strictEqual(claim.missionId, 'MISSION_ROMA_01');

    const submitted = board.submitProof(claim.claimId, { sensorTelemetryHash: 'abc123sha256' });
    assert.strictEqual(submitted.stage, 'SUBMITTED');
    console.log('  ✅ 3. Mission claim and proof submission workflow verified');

    // 4. Test Multi-Asset Separate Rendering
    const html = board.renderBoardHtml({ zoneId: 'ZONE_ORTO_ROMA' });
    assert(html.includes('🪙 50 MYZ'));
    assert(html.includes('⚡ 200 XP'));
    assert(html.includes('🎖️ +10 Rep'));
    assert(html.includes('terminal-theme'));
    console.log('  ✅ 4. Distinct MYZ/XP/Reputation breakdown and responsive UI confirmed');

    console.log('🎉 All Metaverse Bounty Board tests passed 100%!');
}

runBoardTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
