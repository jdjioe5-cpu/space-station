const BaseAdapter = require('./base_adapter');

class CsvAdapter extends BaseAdapter {
    constructor(sourceId = 'CSV_BATCH_INGEST') {
        super(sourceId, 'CSV');
    }

    parseCsv(csvContent) {
        const lines = csvContent.trim().split('\n');
        if (lines.length < 2) return [];
        const headers = lines[0].split(',').map(h => h.trim());
        const results = [];

        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim());
            const obj = {};
            headers.forEach((h, idx) => {
                obj[h] = cols[idx];
            });
            results.push(this.normalizeRecord(obj));
        }
        return results;
    }

    async ingest(csvString) {
        return this.parseCsv(csvString);
    }
}

module.exports = CsvAdapter;
