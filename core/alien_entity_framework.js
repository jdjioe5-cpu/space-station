/**
 * 🌌 Alien Entity Framework & Multi-Agent Communication Protocol #4
 * Resolves Issue #7 (First Alien Population — 5 Entities Compatible with Zorgax)
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
        if (this.entities.has(entityConfig.entity_id)) {
            throw new Error(`Collision detected: entity_id ${entityConfig.entity_id} already registered`);
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
     * Protocol #4 Structured Communication Bus
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

        message.signature = crypto.createHash('sha256').update(JSON.stringify(message)).digest('hex');
        this.messageBus.push(message);
        return message;
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
