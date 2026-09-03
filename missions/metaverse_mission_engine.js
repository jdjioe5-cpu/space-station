/**
 * 🎯 Metaverse Missions & Quests Engine
 * Resolves Issue #36 (P2)
 */

class MetaverseMissionEngine {
    constructor() {
        this.missions = new Map();
        this.cooperativeSessions = new Map(); // missionId -> Set(participantIds)
        this.progressScores = new Map(); // missionId_participantId -> score
    }

    // 1. Register Mission
    createMission(config) {
        if (!config || !config.missionId) throw new Error('Missing missionId');
        const mission = {
            missionId: config.missionId,
            title: config.title || 'Space Station Expedition',
            missionType: config.missionType || 'EXPLORATION',
            npcHost: config.npcHost || 'NPC_PYTHO_GUARDIAN',
            lifeEvidenceTier: config.lifeEvidenceTier || 'SIMULATED',
            rewards: {
                myz: config.rewards?.myz || 50,
                xp: config.rewards?.xp || 200
            },
            targetGoal: config.targetGoal || 100,
            startTime: config.startTime || null,
            endTime: config.endTime || null,
            status: 'ACTIVE'
        };
        this.missions.set(mission.missionId, mission);
        this.cooperativeSessions.set(mission.missionId, new Set());
        return mission;
    }

    // 2. Join Cooperative Challenge
    joinMission(missionId, participantId) {
        const mission = this.missions.get(missionId);
        if (!mission) throw new Error(`Mission ${missionId} not found`);

        const participants = this.cooperativeSessions.get(missionId);
        participants.add(participantId);
        return { missionId, participantId, teamSize: participants.size };
    }

    // 3. Contribute Progress
    contributeProgress(missionId, participantId, points) {
        const mission = this.missions.get(missionId);
        if (!mission) throw new Error(`Mission ${missionId} not found`);

        const key = `${missionId}_${participantId}`;
        const current = this.progressScores.get(key) || 0;
        const updated = current + points;
        this.progressScores.set(key, updated);

        // Check if cooperative goal reached
        let totalScore = 0;
        for (const [k, v] of this.progressScores.entries()) {
            if (k.startsWith(missionId)) totalScore += v;
        }

        const isCompleted = totalScore >= mission.targetGoal;
        return {
            missionId,
            participantId,
            userContribution: updated,
            totalTeamProgress: totalScore,
            targetGoal: mission.targetGoal,
            isCompleted
        };
    }

    // 4. Verify LIFE Evidence Tier Eligibility for MYZ Payout
    canDisburseMYZ(missionId) {
        const mission = this.missions.get(missionId);
        if (!mission) return false;

        // Policy: strictly no MYZ for SIMULATED demo missions
        if (mission.lifeEvidenceTier === 'SIMULATED') {
            return false;
        }
        return true;
    }

    // 5. Event Scheduling Window Checker
    isEventActive(missionId, currentTime = Date.now()) {
        const mission = this.missions.get(missionId);
        if (!mission) return false;
        if (!mission.startTime || !mission.endTime) return true; // Evergreen

        const start = new Date(mission.startTime).getTime();
        const end = new Date(mission.endTime).getTime();
        return currentTime >= start && currentTime <= end;
    }
}

module.exports = MetaverseMissionEngine;
