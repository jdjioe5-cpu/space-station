/**
 * 🎮 Character Quests, Levels & Interactive Milestones Engine
 * Resolves Issue #29 (P2)
 */
const crypto = require('crypto');

class CharacterQuestEngine {
    constructor() {
        this.progression = new Map(); // identityId -> { xp, reputation, level, completedQuests, unlockedBadges, unlockedCosmetics, myzBalance }
        this.quests = new Map();
        this.auditLog = [];
        this._initDefaultQuests();
    }

    _initDefaultQuests() {
        const questList = [
            { questId: 'Q_AVATAR', title: 'Complete Avatar Appearance', category: 'PROFILE', xp: 50, myz: 10, requiredLevel: 1, badge: 'BADGE_STYLE_PIONEER' },
            { questId: 'Q_LORE', title: 'Establish Background Lore & Bio', category: 'PROFILE', xp: 50, myz: 10, requiredLevel: 1 },
            { questId: 'Q_TRAITS', title: 'Calibrate Personality Skills & Traits', category: 'PROFILE', xp: 50, myz: 10, requiredLevel: 1 },
            { questId: 'Q_ONBOARDING', title: 'Complete Interactive Station Walkthrough', category: 'ONBOARDING', xp: 100, myz: 25, requiredLevel: 1, cosmetic: 'SKIN_CADET_VISOR' },
            { questId: 'Q_COMMUNITY', title: 'Participate in Sector Expedition', category: 'COMMUNITY', xp: 150, myz: 50, requiredLevel: 2 },
            { questId: 'Q_ECO_CONTRIB', title: 'Contribute Verifiable Environmental Data', category: 'ECOLOGICAL', xp: 200, myz: 100, requiredLevel: 2, badge: 'BADGE_GREEN_SCOUT' },
            { questId: 'Q_LIFE_MRV', title: 'Attain Certified LIFE MRV Milestone', category: 'LIFE_MRV', xp: 300, myz: 150, requiredLevel: 3, cosmetic: 'SKIN_GOLDEN_EXO' }
        ];

        for (const q of questList) {
            this.quests.set(q.questId, q);
        }
    }

    // Get or initialize progression profile
    getProfile(identityId) {
        if (!this.progression.has(identityId)) {
            this.progression.set(identityId, {
                identityId,
                xp: 0,
                reputation: 10,
                level: 1,
                completedQuests: new Set(),
                unlockedBadges: new Set(['BADGE_NOVICE_CADET']),
                unlockedCosmetics: new Set(['SKIN_STANDARD_SUIT']),
                myzBalance: 0
            });
        }
        return this.progression.get(identityId);
    }

    // Level calculation curve: Level = floor(sqrt(XP / 100)) + 1
    calculateLevel(xp) {
        return Math.floor(Math.sqrt(xp / 100)) + 1;
    }

    // Complete Quest and trigger progression & rewards
    completeQuest(identityId, questId) {
        const quest = this.quests.get(questId);
        if (!quest) throw new Error(`Quest ${questId} does not exist`);

        const profile = this.getProfile(identityId);
        if (profile.completedQuests.has(questId)) {
            throw new Error(`Quest ${questId} already completed by ${identityId}`);
        }

        if (profile.level < quest.requiredLevel) {
            throw new Error(`Level ${quest.requiredLevel} required for this quest (current level: ${profile.level})`);
        }

        // Apply progression
        profile.completedQuests.add(questId);
        profile.xp += quest.xp;
        profile.reputation += Math.floor(quest.xp / 10);
        profile.myzBalance += quest.myz;

        // Check level up
        const newLevel = this.calculateLevel(profile.xp);
        const leveledUp = newLevel > profile.level;
        profile.level = newLevel;

        // Unlock Badges & Cosmetics
        if (quest.badge) profile.unlockedBadges.add(quest.badge);
        if (quest.cosmetic) profile.unlockedCosmetics.add(quest.cosmetic);

        // Audit Log entry
        const receipt = {
            receiptId: `REC_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            identityId,
            questId,
            xpEarned: quest.xp,
            myzDisbursed: quest.myz,
            newLevel: profile.level,
            timestamp: new Date().toISOString()
        };
        receipt.signature = crypto.createHash('sha256').update(JSON.stringify(receipt)).digest('hex');
        this.auditLog.push(receipt);

        return {
            identityId,
            questId,
            xpEarned: quest.xp,
            myzEarned: quest.myz,
            totalLevel: profile.level,
            leveledUp,
            unlockedBadge: quest.badge || null,
            unlockedCosmetic: quest.cosmetic || null,
            signature: receipt.signature
        };
    }

    // Render Mission Board UI HTML MVP
    renderMissionBoardHtml(identityId) {
        const profile = this.getProfile(identityId);
        const rows = Array.from(this.quests.values()).map(q => {
            const isDone = profile.completedQuests.has(q.questId);
            const isLocked = profile.level < q.requiredLevel;
            return `
                <tr class="${isDone ? 'completed' : isLocked ? 'locked' : 'available'}">
                    <td>${q.title}</td>
                    <td><span class="badge">${q.category}</span></td>
                    <td>+${q.xp} XP</td>
                    <td>🪙 ${q.myz} MYZ</td>
                    <td>${isDone ? '✅ DONE' : isLocked ? '🔒 LVL ' + q.requiredLevel : '<button>COMMENCE</button>'}</td>
                </tr>
            `;
        }).join('');

        return `
        <div class="mission-board cyber-theme">
            <header>
                <h3>🛰️ CADET PROGRESSION & QUEST BOARD [${identityId}]</h3>
                <p>Level: <strong>${profile.level}</strong> | XP: <strong>${profile.xp}</strong> | MYZ: <strong>${profile.myzBalance}</strong></p>
            </header>
            <table>
                <thead><tr><th>Mission</th><th>Category</th><th>XP</th><th>Reward</th><th>Status</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
        `;
    }
}

module.exports = CharacterQuestEngine;
