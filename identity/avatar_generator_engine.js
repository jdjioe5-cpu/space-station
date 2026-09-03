/**
 * 🎨 Identity Visuals — Avatar Generator & Style System
 * Resolves Issue #24 (P1)
 */
const crypto = require('crypto');

class AvatarGeneratorEngine {
    constructor() {
        this.palettes = {
            CYBERPUNK: { primary: '#0a0e17', secondary: '#00e5ff', accent: '#ff0055' },
            HUMAN: { primary: '#1a202c', secondary: '#4299e1', accent: '#ed8936' },
            ALIEN: { primary: '#051923', secondary: '#00f5d4', accent: '#9b5de5' }
        };

        this.archetypes = {
            CYBERPUNK: ['NETRUNNER', 'ORBITAL_TECH', 'CHROME_NOMAD'],
            HUMAN: ['SPACE_CADET', 'STATION_BIOLOGIST', 'COMMANDER'],
            ALIEN: ['XENO_SYNTHETIC', 'LUMINOUS_VOIDFARER', 'CRYSTALLINE_SAGE']
        };
    }

    // Deterministic PRNG from String Seed
    _seedRand(seedStr) {
        let hash = crypto.createHash('sha256').update(seedStr).digest('hex');
        let idx = 0;
        return function() {
            if (idx >= hash.length - 8) {
                hash = crypto.createHash('sha256').update(hash).digest('hex');
                idx = 0;
            }
            const val = parseInt(hash.substr(idx, 8), 16) / 0xffffffff;
            idx += 8;
            return val;
        };
    }

    // Generate Avatar Configuration Deterministically
    generateFromSeed(seed, visualFamily = 'CYBERPUNK') {
        const family = this.palettes[visualFamily.toUpperCase()] ? visualFamily.toUpperCase() : 'CYBERPUNK';
        const rand = this._seedRand(seed);

        const archetypeList = this.archetypes[family];
        const archetype = archetypeList[Math.floor(rand() * archetypeList.length)];
        const palette = this.palettes[family];

        const config = {
            avatarId: `AVT_${crypto.createHash('md5').update(seed).digest('hex').substring(0, 10)}`,
            seed,
            visualFamily: family,
            archetype,
            colorPalette: { ...palette },
            layers: {
                face: `FACE_${family}_${Math.floor(rand() * 3) + 1}`,
                hair: `HAIR_${family}_${Math.floor(rand() * 4) + 1}`,
                eyes: `EYES_${family}_${Math.floor(rand() * 3) + 1}`,
                outfit: `OUTFIT_${family}_${Math.floor(rand() * 3) + 1}`,
                accessory: rand() > 0.4 ? `ACC_${family}_VISOR` : 'ACC_NONE'
            },
            generatedAt: new Date().toISOString()
        };

        return config;
    }

    // 1:1 Portrait Vector Rendering
    renderPortraitSvg(avatarConfig) {
        const p = avatarConfig.colorPalette;
        return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
            <rect width="300" height="300" rx="20" fill="${p.primary}"/>
            <circle cx="150" cy="150" r="110" fill="${p.secondary}" fill-opacity="0.15" stroke="${p.secondary}" stroke-width="3"/>
            <!-- Head & Torso Abstract Geometry -->
            <path d="M 90 270 Q 150 200 210 270" fill="${p.secondary}" fill-opacity="0.8"/>
            <circle cx="150" cy="130" r="50" fill="${p.accent}"/>
            <text x="150" y="285" fill="${p.secondary}" font-family="monospace" font-size="12" text-anchor="middle">${avatarConfig.archetype}</text>
        </svg>
        `.trim();
    }

    // Full-Body Vector Composition Rendering
    renderFullBodySvg(avatarConfig) {
        const p = avatarConfig.colorPalette;
        return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 700" width="400" height="700">
            <rect width="400" height="700" rx="24" fill="${p.primary}" stroke="${p.secondary}" stroke-width="2"/>
            <!-- Full Body Composition -->
            <circle cx="200" cy="140" r="45" fill="${p.accent}"/>
            <rect x="150" y="195" width="100" height="220" rx="16" fill="${p.secondary}" fill-opacity="0.7"/>
            <rect x="160" y="425" width="35" height="200" rx="8" fill="${p.secondary}"/>
            <rect x="205" y="425" width="35" height="200" rx="8" fill="${p.secondary}"/>
            <text x="200" y="670" fill="#ffffff" font-family="monospace" font-size="14" text-anchor="middle">${avatarConfig.visualFamily} // ${avatarConfig.archetype}</text>
        </svg>
        `.trim();
    }
}

module.exports = AvatarGeneratorEngine;
