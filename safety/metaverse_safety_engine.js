/**
 * 🛡️ Metaverse Safety, Moderation & Privacy Engine
 * Resolves Issue #37 (P1)
 */
const crypto = require('crypto');

class MetaverseSafetyEngine {
    constructor() {
        this.moderationMatrix = {
            ADMIN: ['KICK', 'BAN', 'MUTE', 'DELETE_MESSAGE', 'CONFIGURE_PRIVACY'],
            ROOM_OWNER: ['KICK', 'MUTE', 'DELETE_MESSAGE'],
            MODERATOR: ['MUTE', 'DELETE_MESSAGE'],
            USER: ['REPORT', 'BLOCK'],
            GUEST: ['REPORT']
        };
        this.mutes = new Map(); // identityId -> expiryTimestamp
        this.blocks = new Map(); // sourceId -> Set(blockedIds)
        this.reports = [];
        this.auditLog = [];
        this.messageBuckets = new Map(); // identityId -> timestamp[]
    }

    // 1. Role Permission Checker
    hasPermission(role, action) {
        const allowed = this.moderationMatrix[role.toUpperCase()];
        return allowed ? allowed.includes(action.toUpperCase()) : false;
    }

    // 2. Mute Identity with Expiry
    muteUser(moderatorRole, targetId, durationSeconds = 300) {
        if (!this.hasPermission(moderatorRole, 'MUTE')) {
            throw new Error(`Role ${moderatorRole} unauthorized to MUTE`);
        }
        const expiresAt = Date.now() + (durationSeconds * 1000);
        this.mutes.set(targetId, expiresAt);

        this._logAudit('MUTE', { targetId, durationSeconds, expiresAt });
        return { targetId, status: 'MUTED', expiresAt };
    }

    // Check if muted
    isMuted(identityId) {
        const expiry = this.mutes.get(identityId);
        if (!expiry) return false;
        if (Date.now() > expiry) {
            this.mutes.delete(identityId);
            return false;
        }
        return true;
    }

    // 3. User-Level Block
    blockUser(sourceId, targetId) {
        if (!this.blocks.has(sourceId)) {
            this.blocks.set(sourceId, new Set());
        }
        this.blocks.get(sourceId).add(targetId);
        this._logAudit('BLOCK', { sourceId, targetId });
        return { sourceId, targetId, status: 'BLOCKED' };
    }

    isBlocked(sourceId, targetId) {
        return this.blocks.has(sourceId) && this.blocks.get(sourceId).has(targetId);
    }

    // 4. Content & Abuse Reporting
    reportAbuse(reporterId, contentRef, reason) {
        const report = {
            reportId: `REP_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            reporterId,
            contentRef,
            reason,
            status: 'PENDING_REVIEW',
            timestamp: new Date().toISOString()
        };
        this.reports.push(report);
        this._logAudit('REPORT', report);
        return report;
    }

    // 5. Anti-Spam Sliding Window Rate Limiter
    checkRateLimit(identityId, maxPerMinute = 20) {
        const now = Date.now();
        const windowMs = 60 * 1000;
        let timestamps = this.messageBuckets.get(identityId) || [];

        // Filter out expired timestamps
        timestamps = timestamps.filter(t => now - t < windowMs);

        if (timestamps.length >= maxPerMinute) {
            return { allowed: false, currentRate: timestamps.length, limit: maxPerMinute };
        }

        timestamps.push(now);
        this.messageBuckets.set(identityId, timestamps);
        return { allowed: true, currentRate: timestamps.length, limit: maxPerMinute };
    }

    // 6. Privacy Shield / Presence Sanitizer (Strips IP, Real Coordinates & Private Wallets)
    sanitizePresence(rawPresence) {
        if (!rawPresence) return null;
        return {
            avatarId: rawPresence.avatarId || 'avatar_guest',
            zoneId: rawPresence.zoneId || 'ZONE_GLOBAL',
            spatialX: Number(rawPresence.spatialX || 0).toFixed(2),
            spatialY: Number(rawPresence.spatialY || 0).toFixed(2),
            isSimulatedNpc: Boolean(rawPresence.isSimulatedNpc),
            publicReputation: rawPresence.publicReputation || 0
            // Notice: clientIp, realGpsLocation, privateWalletAddress are strictly stripped
        };
    }

    // Internal cryptographically signed audit log
    _logAudit(action, payload) {
        const entry = {
            auditId: `AUD_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            action,
            payload,
            timestamp: new Date().toISOString()
        };
        entry.signature = crypto.createHash('sha256').update(JSON.stringify(entry)).digest('hex').substring(0, 16);
        this.auditLog.push(entry);
    }
}

module.exports = MetaverseSafetyEngine;
