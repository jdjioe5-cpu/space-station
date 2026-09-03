/**
 * 🕹️ Identity UX — Character Creator Visual Flow Engine
 * Resolves Issue #22 (P1)
 */
const crypto = require('crypto');

const STEPS = ['START', 'ARCHETYPE', 'APPEARANCE', 'STYLE', 'IDENTITY_DETAILS', 'PREVIEW', 'CONFIRM'];

class CharacterCreatorFlow {
    constructor() {
        this.sessions = new Map();
    }

    // Start New Character Creation Session
    startSession(sessionId = null) {
        const sid = sessionId || `SESS_${crypto.randomBytes(6).toString('hex')}`;
        const now = new Date().toISOString();

        const session = {
            sessionId: sid,
            currentStep: 'START',
            status: 'DRAFT',
            data: {
                archetype: 'NETRUNNER',
                visualFamily: 'CYBERPUNK',
                displayName: '',
                handle: '',
                palette: { primary: '#0a0e17', secondary: '#00e5ff', accent: '#ff0055' },
                layers: { face: 'DEFAULT', hair: 'NEON_SPIKE', outfit: 'SUIT_ORBITAL' }
            },
            history: ['START'],
            createdAt: now,
            updatedAt: now
        };

        this.sessions.set(sid, session);
        return session;
    }

    // Transition to Next Step with Data Update
    nextStep(sessionId, stepData = {}) {
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error(`Session ${sessionId} not found`);
        if (session.status === 'PUBLISHED') throw new Error(`Cannot modify published character`);

        const currentIdx = STEPS.indexOf(session.currentStep);
        if (currentIdx < STEPS.length - 1) {
            session.currentStep = STEPS[currentIdx + 1];
            session.history.push(session.currentStep);
        }

        // Merge incoming payload
        session.data = { ...session.data, ...stepData };
        session.updatedAt = new Date().toISOString();

        return session;
    }

    // Jump / Navigate to Specific Valid Step
    goToStep(sessionId, targetStep) {
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error(`Session ${sessionId} not found`);
        if (!STEPS.includes(targetStep)) throw new Error(`Invalid step: ${targetStep}`);
        if (session.status === 'PUBLISHED') throw new Error(`Session is already published`);

        session.currentStep = targetStep;
        session.updatedAt = new Date().toISOString();
        return session;
    }

    // Final Confirmation & Publication
    confirmAndPublish(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error(`Session ${sessionId} not found`);

        if (!session.data.displayName || !session.data.handle) {
            throw new Error('displayName and handle are required to publish');
        }

        session.currentStep = 'CONFIRM';
        session.status = 'PUBLISHED';
        session.publishedAt = new Date().toISOString();
        session.characterId = `myz:char:${crypto.createHash('sha256').update(sessionId + session.publishedAt).digest('hex').substring(0, 16)}`;

        return {
            characterId: session.characterId,
            status: session.status,
            characterBundle: this.exportConfigBundle(sessionId)
        };
    }

    // Export Complete Visual & Identity Configuration Bundle
    exportConfigBundle(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error(`Session ${sessionId} not found`);

        return {
            sessionId: session.sessionId,
            characterId: session.characterId || null,
            status: session.status,
            visualConfig: {
                archetype: session.data.archetype,
                visualFamily: session.data.visualFamily,
                palette: session.data.palette,
                layers: session.data.layers
            },
            identityProfile: {
                displayName: session.data.displayName,
                handle: session.data.handle.startsWith('@') ? session.data.handle : `@${session.data.handle}`
            },
            exportedAt: new Date().toISOString()
        };
    }

    // Render Mobile-First Cyber-Terminal Wizard Wireframe HTML
    renderWizardWireframeHtml(sessionId) {
        const session = this.sessions.get(sessionId);
        const step = session ? session.currentStep : 'START';

        return `
        <div class="character-creator-wizard mobile-first-container">
            <header class="wizard-header">
                <h2>🛰️ SPACE STATION — CHARACTER CREATOR</h2>
                <div class="step-indicator">STEP: [${step}] (${STEPS.indexOf(step) + 1}/${STEPS.length})</div>
            </header>
            <main class="wizard-body">
                <div class="creator-preview-panel">
                    <div class="live-avatar-preview">
                        <h3>👁️ LIVE PREVIEW</h3>
                        <p class="preview-name">${session ? session.data.displayName || 'Unnamed Pioneer' : ''}</p>
                        <span class="badge archetype">${session ? session.data.archetype : 'NETRUNNER'}</span>
                    </div>
                </div>
                <div class="wizard-controls">
                    <button class="btn-prev" onclick="handlePrevStep()">← PREVIOUS</button>
                    <button class="btn-save-draft" onclick="handleSaveDraft()">💾 SAVE DRAFT</button>
                    <button class="btn-next primary" onclick="handleNextStep()">CONTINUE →</button>
                </div>
            </main>
        </div>
        `;
    }
}

module.exports = CharacterCreatorFlow;
