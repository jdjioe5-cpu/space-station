/**
 * 📜 Identity Lore — Persona, Skills, Traits & Biography Builder
 * Resolves Issue #26 (P2)
 */
const crypto = require('crypto');

class PersonaLoreBuilder {
    constructor() {
        this.loreStore = new Map(); // identityId -> { currentLore, revisions }
    }

    // Safety & moderation filter
    _moderateText(text) {
        if (!text) return { clean: true, sanitized: '' };
        // Detect malicious injection / system script tags / prohibited terms
        const prohibited = ['<script>', 'DROP TABLE', 'ADMIN_OVERRIDE', 'eval('];
        let clean = true;
        let sanitized = text;

        for (const pattern of prohibited) {
            if (sanitized.includes(pattern)) {
                clean = false;
                sanitized = sanitized.split(pattern).join('[MODERATED_CONTENT]');
            }
        }
        return { clean, sanitized };
    }

    // Create or Update Persona Lore
    saveLore(identityId, loreData) {
        const modBio = this._moderateText(loreData.biography || '');
        const modOrigin = this._moderateText(loreData.originStory || '');
        const safetyStatus = (modBio.clean && modOrigin.clean) ? 'CLEAN' : 'FLAGGED';

        const entry = this.loreStore.get(identityId) || { currentLore: null, revisions: [] };
        const nextVersion = entry.currentLore ? entry.currentLore.version + 1 : 1;

        const updatedLore = {
            identityId,
            version: nextVersion,
            biography: modBio.sanitized,
            originStory: modOrigin.sanitized,
            interests: loreData.interests || [],
            declaredSkills: loreData.declaredSkills || [], // Strictly narrative metadata
            personalityTraits: loreData.personalityTraits || [],
            goals: loreData.goals || [],
            affiliations: loreData.affiliations || [],
            preferredEntityRelationships: loreData.preferredEntityRelationships || [],
            safetyStatus,
            updatedAt: new Date().toISOString()
        };

        // Compute revision signature
        const revisionSig = crypto.createHash('sha256').update(JSON.stringify(updatedLore)).digest('hex');
        entry.revisions.push({ version: nextVersion, timestamp: updatedLore.updatedAt, signature: revisionSig });
        entry.currentLore = updatedLore;
        this.loreStore.set(identityId, entry);

        return updatedLore;
    }

    // Get Public Persona View (Enforces Declared Skill vs Technical Capability Boundary)
    getPublicPersonaView(identityId, verifiedCapabilities = []) {
        const entry = this.loreStore.get(identityId);
        if (!entry || !entry.currentLore) throw new Error(`Lore for identity ${identityId} not found`);

        const lore = entry.currentLore;

        return {
            identityId: lore.identityId,
            version: lore.version,
            biography: lore.biography,
            originStory: lore.originStory,
            interests: lore.interests,
            personalityTraits: lore.personalityTraits,
            goals: lore.goals,
            affiliations: lore.affiliations,
            safetyStatus: lore.safetyStatus,
            // Strict segregation: Declared skills vs verified technical capabilities
            narrativeSkills: lore.declaredSkills,
            verifiedCapabilities: verifiedCapabilities // Passed authoritatively from security engine
        };
    }

    // Render Visual Lore Editor & Live Preview UI MVP
    renderEditorPreviewHtml(identityId) {
        const entry = this.loreStore.get(identityId);
        const lore = entry ? entry.currentLore : { biography: '', originStory: '', declaredSkills: [], personalityTraits: [] };

        return `
        <div class="persona-lore-editor cyber-terminal">
            <div class="editor-pane">
                <h3>✍️ EDIT IDENTITY LORE [${identityId}]</h3>
                <label>Biography:</label>
                <textarea class="input-bio">${lore.biography}</textarea>
                <label>Origin Story:</label>
                <textarea class="input-origin">${lore.originStory}</textarea>
                <label>Declared Skills:</label>
                <input class="input-skills" value="${lore.declaredSkills.join(', ')}" />
            </div>
            <div class="preview-pane">
                <h3>👁️ LIVE DOSSIER PREVIEW</h3>
                <div class="dossier-card">
                    <p class="bio"><strong>Bio:</strong> ${lore.biography || 'No transmission recorded.'}</p>
                    <p class="origin"><strong>Origin:</strong> ${lore.originStory || 'Unknown sector.'}</p>
                    <div class="traits">
                        ${lore.personalityTraits.map(t => `<span class="tag trait">${t}</span>`).join('')}
                    </div>
                    <div class="skills-disclaimer">
                        <small>⚠️ Declared skills are narrative persona attributes only.</small>
                    </div>
                </div>
            </div>
        </div>
        `;
    }
}

module.exports = PersonaLoreBuilder;
