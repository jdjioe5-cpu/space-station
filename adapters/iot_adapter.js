const BaseAdapter = require('./base_adapter');

class IotAdapter extends BaseAdapter {
    constructor(deviceId = 'ESP32_SENSOR_NODE') {
        super(deviceId, 'IOT_TELEMETRY');
    }

    async ingest(telemetryPacket) {
        if (!telemetryPacket || !telemetryPacket.deviceId) {
            throw new Error('Malformed IoT telemetry packet');
        }
        const record = {
            temperature: telemetryPacket.t,
            humidity: telemetryPacket.h,
            co2: telemetryPacket.c,
            tempUnit: telemetryPacket.u || 'C'
        };
        const normalized = this.normalizeRecord(record);
        normalized.provenance.deviceId = telemetryPacket.deviceId;
        return normalized;
    }
}

module.exports = IotAdapter;
