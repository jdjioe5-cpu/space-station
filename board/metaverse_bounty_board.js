/**
 * 🛰️ Metaverse Bounty Board Engine & UI Renderer
 * Resolves Issue #39 (P1)
 */

class MetaverseBountyBoard {
    constructor() {
        this.missions = new Map();
        this.userClaims = new Map(); // claimId -> state
    }

    // Register mission into board
    addMission(mission) {
        if (!mission || !mission.id) throw new Error('Invalid mission payload');
        const entry = {
            id: mission.id,
            title: mission.title,
            zoneId: mission.zoneId || 'GLOBAL',
            category: mission.category || 'ENVIRONMENTAL',
            difficulty: mission.difficulty || 'MEDIUM',
            rewards: {
                myz: mission.rewards?.myz || 50,
                xp: mission.rewards?.xp || 200,
                reputation: mission.rewards?.reputation || 15
            },
            status: 'AVAILABLE',
            issuer: mission.issuer || 'Pytho Guardian NPC'
        };
        this.missions.set(entry.id, entry);
        return entry;
    }

    // Query missions with filters (Global or Zone-specific)
    getMissions(filter = {}) {
        let results = Array.from(this.missions.values());
        if (filter.zoneId && filter.zoneId !== 'GLOBAL') {
            results = results.filter(m => m.zoneId === filter.zoneId || m.zoneId === 'GLOBAL');
        }
        if (filter.category) {
            results = results.filter(m => m.category.toUpperCase() === filter.category.toUpperCase());
        }
        if (filter.difficulty) {
            results = results.filter(m => m.difficulty.toUpperCase() === filter.difficulty.toUpperCase());
        }
        return results;
    }

    // Claim Mission
    claimMission(missionId, participantId) {
        const mission = this.missions.get(missionId);
        if (!mission) throw new Error(`Mission ${missionId} not found`);
        if (mission.status !== 'AVAILABLE') throw new Error(`Mission status is ${mission.status}, cannot claim`);

        const claimId = `CLM_${missionId}_${participantId}_${Date.now().toString(36)}`;
        const claim = {
            claimId,
            missionId,
            participantId,
            stage: 'IN_PROGRESS',
            claimedAt: new Date().toISOString()
        };
        this.userClaims.set(claimId, claim);
        return claim;
    }

    // Submit Evidence & Progress
    submitProof(claimId, proofPayload) {
        const claim = this.userClaims.get(claimId);
        if (!claim) throw new Error(`Claim ${claimId} not found`);
        claim.stage = 'SUBMITTED';
        claim.proofPayload = proofPayload;
        claim.submittedAt = new Date().toISOString();
        return claim;
    }

    // Render Cyberpunk Responsive Board HTML
    renderBoardHtml(filter = {}) {
        const missions = this.getMissions(filter);
        const rows = missions.map(m => `
            <div class="bounty-card" data-zone="${m.zoneId}" data-id="${m.id}">
                <div class="bounty-header">
                    <span class="badge difficulty-${m.difficulty.toLowerCase()}">${m.difficulty}</span>
                    <span class="zone-tag">[${m.zoneId}]</span>
                    <h4>${m.title}</h4>
                </div>
                <div class="rewards-breakdown">
                    <span class="reward-item myz-token">🪙 ${m.rewards.myz} MYZ</span>
                    <span class="reward-item xp-points">⚡ ${m.rewards.xp} XP</span>
                    <span class="reward-item rep-score">🎖️ +${m.rewards.reputation} Rep</span>
                </div>
                <button class="btn-claim" onclick="claimMission('${m.id}')">CLAIM MISSION</button>
            </div>
        `).join('');

        return `
        <div class="metaverse-bounty-board terminal-theme">
            <header class="terminal-bar">
                <h2>🛰️ SPACE STATION BOUNTY BOARD // ZONE: ${filter.zoneId || 'GLOBAL'}</h2>
            </header>
            <div class="bounty-grid">${rows}</div>
        </div>
        `;
    }
}

module.exports = MetaverseBountyBoard;
