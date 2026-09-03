/**
 * Common Adapter Interface for Environmental Telemetry Ingestion
 */
const crypto = require('crypto');
const UnitNormalizer = require('./normalizer');

class BaseAdapter {
    constructor(sourceId, sourceType) {
        if (new.target === BaseAdapter) {
            throw new TypeError('Cannot construct BaseAdapter instances directly');
        }
        this.sourceId = sourceId;
        this.sourceType = sourceType;
    }

    tagProvenance(record) {
        const payloadStr = JSON.stringify(record);
        const recordHash = crypto.createHash('sha256').update(payloadStr).digest('hex').substring(0, 16);
        return {
            sourceId: this.sourceId,
            sourceType: this.sourceType,
            recordHash,
            ingestedAt: new Date().toISOString()
        };
    }

    normalizeRecord(raw) {
        const temp = UnitNormalizer.normalizeTemperature(raw.temperature, raw.tempUnit || 'C');
        const humidity = UnitNormalizer.normalizeHumidity(raw.humidity);
        const co2 = raw.co2 !== undefined ? UnitNormalizer.normalizeCO2(raw.co2, raw.co2Unit || 'ppm') : null;

        const flags = [];
        if (temp.quality !== 'VALID') flags.push(`TEMP_${temp.quality}`);
        if (humidity.quality !== 'VALID') flags.push(`HUMIDITY_${humidity.quality}`);
        if (co2 && co2.quality !== 'VALID') flags.push(`CO2_${co2.quality}`);

        const overallQuality = flags.length === 0 ? 'VALID' : (flags.some(f => f.includes('OUTLIER')) ? 'OUTLIER' : 'DEGRADED');

        return {
            provenance: this.tagProvenance(raw),
            metrics: {
                temperature: temp,
                humidity,
                co2
            },
            qualityFlags: flags,
            overallQuality
        };
    }

    async ingest(input) {
        throw new Error('Method ingest() must be implemented');
    }
}

module.exports = BaseAdapter;
