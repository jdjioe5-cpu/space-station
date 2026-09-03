const BaseAdapter = require('./base_adapter');

class ApiAdapter extends BaseAdapter {
    constructor(sourceId = 'REST_API_GW') {
        super(sourceId, 'API');
    }

    async ingest(apiPayload) {
        if (!apiPayload || typeof apiPayload !== 'object') {
            throw new Error('Invalid API payload');
        }
        return this.normalizeRecord(apiPayload);
    }
}

module.exports = ApiAdapter;
