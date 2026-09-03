/**
 * ⚡ Metaverse Realtime Presence, Chat & Interaction Engine
 * Resolves Issue #32 (P1)
 */
const crypto = require('crypto');

class MetaverseRealtimeEngine {
    constructor() {
        this.sessions = new Map(); // sessionToken -> { identityId, roomId, presenceStatus, lastHeartbeat }
        this.positions = new Map(); // identityId -> { x: number, y: number, orientation: number }
        this.roomMembers = new Map(); // roomId -> Set(identityId)
        this.roomChat = new Map(); // roomId -> Array(message)
    }

    // 1. Establish / Connect Session
    connect(identityId, roomId = 'ZONE_STATION_HUB') {
        const sessionToken = crypto.createHash('sha256').update(`${identityId}:${Date.now()}:${Math.random()}`).digest('hex');
        const session = {
            sessionToken,
            identityId,
            roomId,
            presenceStatus: 'ONLINE',
            connectedAt: new Date().toISOString(),
            lastHeartbeat: Date.now()
        };
        this.sessions.set(sessionToken, session);

        // Join room
        if (!this.roomMembers.has(roomId)) this.roomMembers.set(roomId, new Set());
        this.roomMembers.get(roomId).add(identityId);

        // Default initial coordinates
        this.positions.set(identityId, { x: 0.0, y: 0.0, orientation: 0.0 });

        return session;
    }

    // 2. Reconnect & Resume Session
    resumeSession(sessionToken) {
        const session = this.sessions.get(sessionToken);
        if (!session) throw new Error('Session token expired or invalid');
        session.presenceStatus = 'ONLINE';
        session.lastHeartbeat = Date.now();
        return session;
    }

    // 3. Update Position & Orientation with Interpolation
    updatePosition(identityId, targetX, targetY, orientation = 0.0) {
        const current = this.positions.get(identityId) || { x: 0, y: 0, orientation: 0 };
        // Server-side authoritative smoothing / interpolation
        const smoothedX = current.x + (targetX - current.x) * 0.8;
        const smoothedY = current.y + (targetY - current.y) * 0.8;

        const updated = {
            x: Number(smoothedX.toFixed(2)),
            y: Number(smoothedY.toFixed(2)),
            orientation: Number(orientation.toFixed(1)),
            timestamp: Date.now()
        };
        this.positions.set(identityId, updated);
        return updated;
    }

    // 4. Send Room Chat Message
    sendChatMessage(sessionToken, content) {
        const session = this.sessions.get(sessionToken);
        if (!session) throw new Error('Unauthorized session');
        if (session.presenceStatus === 'OFFLINE') throw new Error('Offline users cannot chat');

        if (!this.roomChat.has(session.roomId)) {
            this.roomChat.set(session.roomId, []);
        }

        const msg = {
            msgId: `MSG_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`,
            identityId: session.identityId,
            roomId: session.roomId,
            content: content.trim(),
            timestamp: new Date().toISOString()
        };

        const chatLog = this.roomChat.get(session.roomId);
        chatLog.push(msg);
        if (chatLog.length > 100) chatLog.shift(); // retain last 100 messages

        return msg;
    }

    // 5. Trigger Interaction Event
    triggerInteraction(sourceId, targetId, eventType, metadata = {}) {
        const allowed = ['WAVE', 'INSPECT', 'TRADE_REQUEST', 'QUEST_JOIN'];
        if (!allowed.includes(eventType.toUpperCase())) {
            throw new Error(`Invalid interaction eventType: ${eventType}`);
        }

        const event = {
            eventId: `EVT_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            sourceId,
            targetId,
            eventType: eventType.toUpperCase(),
            metadata,
            timestamp: new Date().toISOString()
        };
        return event;
    }

    // 6. Proximity Query
    getNearbyIdentities(identityId, radius = 10.0) {
        const origin = this.positions.get(identityId);
        if (!origin) return [];

        const nearby = [];
        for (const [id, pos] of this.positions.entries()) {
            if (id === identityId) continue;
            const dist = Math.hypot(pos.x - origin.x, pos.y - origin.y);
            if (dist <= radius) {
                nearby.push({ identityId: id, distance: Number(dist.toFixed(2)), pos });
            }
        }
        return nearby;
    }
}

module.exports = MetaverseRealtimeEngine;
