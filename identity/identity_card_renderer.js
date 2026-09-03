/**
 * 🪪 Identity Card — Public Profile, Badge & QR/Share View
 * Resolves Issue #25 (P1)
 */
const crypto = require('crypto');

class IdentityCardRenderer {
    constructor(baseUrl = 'https://spacestation.myzubster.io') {
        this.baseUrl = baseUrl;
    }

    // Build Sanitized Identity Card Data Model
    buildCardModel(identityRecord) {
        if (!identityRecord.identityId) throw new Error('identityId is required');

        // Shorten identity ID (e.g. ID_9f2a...8c)
        const rawId = identityRecord.identityId;
        const abbrev = rawId.length > 12 ? `${rawId.substring(0, 6)}...${rawId.substring(rawId.length - 4)}` : rawId;

        // Privacy scrubbing: Remove private wallets, physical coordinates, and emails
        const isSim = Boolean(identityRecord.isSimulatedEntity);
        const isVer = identityRecord.verificationStatus === 'SYSTEM_VERIFIED' || identityRecord.verificationStatus === 'CRYPTOGRAPHICALLY_PROVEN';

        const deepLink = `${this.baseUrl}/id/${rawId}`;
        const nativeProtocolLink = `myz://identity/${rawId}`;

        const cardModel = {
            identityId: rawId,
            abbreviatedId: abbrev,
            displayName: identityRecord.displayName || 'Cadet',
            handle: identityRecord.handle ? `@${identityRecord.handle.replace('@', '')}` : `@${rawId.substring(0, 8)}`,
            archetypeSpecies: identityRecord.archetypeSpecies || 'Cosmic Pioneer',
            entityType: isSim ? 'SIMULATED' : 'HUMAN',
            verificationBadge: isVer ? 'VERIFIED' : 'UNVERIFIED',
            deepLink,
            nativeProtocolLink,
            avatarUrl: identityRecord.avatarUrl || '/assets/avatars/default_cadet.svg',
            createdAt: identityRecord.createdAt || new Date().toISOString()
        };

        return cardModel;
    }

    // Export Card as Scalable Vector Graphic (SVG)
    exportCardSvg(cardModel) {
        const badgeColor = cardModel.verificationBadge === 'VERIFIED' ? '#00ffaa' : '#888888';
        const entityColor = cardModel.entityType === 'SIMULATED' ? '#ff0077' : '#00e5ff';

        return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 600" width="450" height="600">
            <defs>
                <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#0a0e17"/>
                    <stop offset="100%" stop-color="#161f30"/>
                </linearGradient>
                <linearGradient id="borderGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stop-color="#00e5ff"/>
                    <stop offset="100%" stop-color="#7928ca"/>
                </linearGradient>
            </defs>
            <rect width="450" height="600" rx="20" fill="url(#bgGrad)" stroke="url(#borderGrad)" stroke-width="4"/>
            <text x="30" y="50" fill="#00e5ff" font-family="monospace" font-size="14" letter-spacing="2">MYZUBSTER SPACE STATION</text>
            <text x="370" y="50" fill="#666" font-family="monospace" font-size="12">${cardModel.abbreviatedId}</text>

            <!-- Hologram Avatar Placeholder -->
            <rect x="125" y="80" width="200" height="200" rx="100" fill="#121a29" stroke="#00e5ff" stroke-width="2"/>
            <text x="225" y="190" fill="#00e5ff" font-family="sans-serif" font-size="32" text-anchor="middle">🛰️</text>

            <!-- Metadata -->
            <text x="225" y="320" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="24" text-anchor="middle">${cardModel.displayName}</text>
            <text x="225" y="350" fill="#00e5ff" font-family="monospace" font-size="16" text-anchor="middle">${cardModel.handle}</text>
            <text x="225" y="385" fill="#8892b0" font-family="sans-serif" font-size="14" text-anchor="middle">${cardModel.archetypeSpecies}</text>

            <!-- Badges -->
            <rect x="90" y="420" width="120" height="32" rx="16" fill="#182338" stroke="${entityColor}" stroke-width="1.5"/>
            <text x="150" y="441" fill="${entityColor}" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">${cardModel.entityType}</text>

            <rect x="240" y="420" width="120" height="32" rx="16" fill="#182338" stroke="${badgeColor}" stroke-width="1.5"/>
            <text x="300" y="441" fill="${badgeColor}" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">${cardModel.verificationBadge}</text>

            <!-- Deep Link Footer -->
            <line x1="30" y1="490" x2="420" y2="490" stroke="#233554" stroke-width="1"/>
            <text x="225" y="530" fill="#64ffda" font-family="monospace" font-size="11" text-anchor="middle">DEEP LINK / QR ROUTE:</text>
            <text x="225" y="555" fill="#8892b0" font-family="monospace" font-size="10" text-anchor="middle">${cardModel.deepLink}</text>
        </svg>
        `.trim();
    }

    // Render Responsive HTML Identity Card
    renderCardHtml(cardModel) {
        return `
        <div class="myz-identity-card responsive-card ${cardModel.entityType.toLowerCase()}">
            <div class="card-header">
                <span class="station-mark">MYZUBSTER SPACE STATION</span>
                <span class="short-id">${cardModel.abbreviatedId}</span>
            </div>
            <div class="card-avatar">
                <img src="${cardModel.avatarUrl}" alt="${cardModel.displayName}" />
            </div>
            <div class="card-body">
                <h3 class="display-name">${cardModel.displayName}</h3>
                <span class="handle">${cardModel.handle}</span>
                <p class="archetype">${cardModel.archetypeSpecies}</p>
                <div class="badges-row">
                    <span class="badge badge-entity ${cardModel.entityType.toLowerCase()}">${cardModel.entityType}</span>
                    <span class="badge badge-verif ${cardModel.verificationBadge.toLowerCase()}">${cardModel.verificationBadge}</span>
                </div>
            </div>
            <div class="card-footer">
                <a href="${cardModel.deepLink}" class="qr-link" target="_blank">🔗 PUBLIC PROFILE</a>
            </div>
        </div>
        `;
    }
}

module.exports = IdentityCardRenderer;
