/**
 * Unit Normalization & Quality Flag Engine
 */
class UnitNormalizer {
    static normalizeTemperature(value, unit = 'C') {
        const num = parseFloat(value);
        if (isNaN(num)) return { value: null, quality: 'MISSING' };
        let celsius = num;
        if (unit.toUpperCase() === 'F') celsius = (num - 32) * (5 / 9);
        else if (unit.toUpperCase() === 'K') celsius = num - 273.15;

        // Biological / Planetary realistic boundary (-60C to +80C)
        let quality = 'VALID';
        if (celsius < -60 || celsius > 80) quality = 'OUTLIER';
        return { value: Number(celsius.toFixed(2)), unit: 'C', quality };
    }

    static normalizeHumidity(value) {
        const num = parseFloat(value);
        if (isNaN(num)) return { value: null, quality: 'MISSING' };
        let quality = 'VALID';
        if (num < 0 || num > 100) quality = 'OUTLIER';
        return { value: Number(Math.max(0, Math.min(100, num)).toFixed(1)), unit: '%', quality };
    }

    static normalizeCO2(value, unit = 'ppm') {
        const num = parseFloat(value);
        if (isNaN(num)) return { value: null, quality: 'MISSING' };
        let ppm = num;
        if (unit.toLowerCase() === 'ppb') ppm = num / 1000;
        let quality = 'VALID';
        if (ppm < 200 || ppm > 10000) quality = 'OUTLIER';
        return { value: Number(ppm.toFixed(1)), unit: 'ppm', quality };
    }
}

module.exports = UnitNormalizer;
