/**
 * Alien Entity Management Framework & Protocol #4 Communication Bus
 * Core implementation for Issue #7 (DanielIoni-creator/space-station)
 */
const crypto = require('crypto');

class MemoryNamespace {
    constructor(namespace) {
        this.namespace = namespace;
        this.store = new Map();
    }

    set(key, value) {
        this.store.set(key, { value, updatedAt: new Date().toISOString() });
    }

    get(key) {
        const item = this.store.get(key);
        return item ? item.value : null;
    }

    has(key) {
        return this.store.has(key);
    }
}

class AlienEntityManager {
    constructor() {
        this.entities = new Map();
        this.memories = new Map(); // entity_id -> MemoryNamespace
        this.messageBus = [];
    }

    registerEntity(entityConfig) {
        if (!entityConfig || !entityConfig.entity_id) {
            throw new Error('Invalid entity configuration: entity_id required');
        }
        if (entityConfig.simulated_entity !== true) {
            throw new Error('Entity must explicitly declare simulated_entity: true');
        }
        if (!entityConfig.memory_namespace || typeof entityConfig.memory_namespace !== 'string' || entityConfig.memory_namespace.trim() === '') {
            throw new Error('Invalid entity configuration: memory_namespace must be a non-empty string');
        }
        if (this.entities.has(entityConfig.entity_id)) {
            throw new Error(`Collision detected: entity_id ${entityConfig.entity_id} already registered`);
        }
        // Enforce unique memory namespace across all registered entities
        for (const existing of this.entities.values()) {
            if (existing.memory_namespace === entityConfig.memory_namespace) {
                throw new Error(`Collision detected: memory_namespace ${entityConfig.memory_namespace} already registered`);
            }
        }

        this.entities.set(entityConfig.entity_id, entityConfig);
        this.memories.set(entityConfig.entity_id, new MemoryNamespace(entityConfig.memory_namespace));
        return entityConfig;
    }

    getMemory(entityId) {
        const mem = this.memories.get(entityId);
        if (!mem) throw new Error(`No memory namespace found for ${entityId}`);
        return mem;
    }

    /**
     * Compute deterministic SHA-256 content integrity hash for Protocol #4 messages
     */
    computeContentHash(messageObj) {
        const canonical = {
            message_id: messageObj.message_id,
            protocol_version: messageObj.protocol_version,
            sender: messageObj.sender,
            recipient: messageObj.recipient,
            message_type: messageObj.message_type,
            payload: messageObj.payload,
            timestamp: messageObj.timestamp
        };
        return crypto.createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
    }

    /**
     * Protocol #4 Structured Communication Bus
     * Uses deterministic SHA-256 content integrity hash for payload tamper detection
     */
    sendMessage(senderId, recipientId, messageType, payload) {
        const sender = this.entities.get(senderId);
        const recipient = this.entities.get(recipientId);

        if (!sender) throw new Error(`Sender ${senderId} not registered`);
        if (!recipient) throw new Error(`Recipient ${recipientId} not registered`);

        const message = {
            message_id: `MSG_${Date.now()}_${this.messageBus.length + 1}`,
            protocol_version: 'protocol.v4',
            sender: senderId,
            recipient: recipientId,
            message_type: messageType,
            payload,
            timestamp: new Date().toISOString()
        };

        message.content_hash = this.computeContentHash(message);
        this.messageBus.push(message);
        return message;
    }

    /**
     * Verify Protocol #4 message content integrity
     */
    verifyMessage(message) {
        if (!message || !message.content_hash) return false;
        const expectedHash = this.computeContentHash(message);
        return message.content_hash === expectedHash;
    }

    /**
     * Multi-Entity Simulation Runner: Simulates collaborative observation
     */
    runMultiEntitySimulation(primaryEntityId, peerIds, scenarioPayload) {
        const primary = this.entities.get(primaryEntityId);
        if (!primary) throw new Error(`Primary entity ${primaryEntityId} not found`);

        const sessionLog = [];
        const sessionMem = this.getMemory(primaryEntityId);
        sessionMem.set(`scenario_${Date.now()}`, scenarioPayload);

        sessionLog.push({
            speaker: primary.name,
            action: 'DISPATCH_SCENARIO_INQUIRY',
            content: `Observer ${primary.name} detected event: ${scenarioPayload.title}. Requesting collective consensus.`
        });

        for (const peerId of peerIds) {
            const peer = this.entities.get(peerId);
            if (!peer) throw new Error(`Peer entity ${peerId} not found`);

            const msg = this.sendMessage(primaryEntityId, peerId, 'ENVIRONMENTAL_CONSENSUS_REQUEST', scenarioPayload);
            const peerMem = this.getMemory(peerId);
            peerMem.set(`received_${msg.message_id}`, scenarioPayload);

            sessionLog.push({
                speaker: peer.name,
                role: peer.role,
                action: 'DELIVER_CONSENSUS_ASSESSMENT',
                content: `Entity ${peer.name} (${peer.species}, ${peer.role}): Analysis in alignment with focus on [${peer.focus_areas.join(', ')}]. Verification affirmed.`
            });
        }

        return {
            simulation_id: `SIM_CONTACT_${Date.now()}`,
            primary_entity: primaryEntityId,
            participants: [primaryEntityId, ...peerIds],
            exchanges_count: sessionLog.length,
            session_log: sessionLog,
            status: 'COMPLETED_CONSENSUS'
        };
    }
}

module.exports = {
    AlienEntityManager,
    MemoryNamespace
};
