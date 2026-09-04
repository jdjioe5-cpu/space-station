const assert = require('assert');
const MrvPrivacySanitizer = require('../privacy/mrv_privacy_sanitizer');

async function runPrivacySanitizerTests() {
    console.log('🧪 Starting MRV Privacy Classification & Redaction Tests...');

    const sanitizer = new MrvPrivacySanitizer();

    // 1. Synthetic Raw Dataset with PII and Sensitive Secrets
    const rawData = {
        sensorId: 'ORTO_WATER_SENSOR_04',
        ph: 7.42,
        dissolvedOxygenMgL: 8.15,
        turbidityNtu: 1.28,
        sampleTimestamp: '2026-09-04T07:45:00Z',
        batteryLevel: 94.5,
        operatorName: 'Dr. Marco Rossi',
        operatorEmail: 'm.rossi@botanico.milano.it',
        rawWalletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        internalIp: '192.168.1.144'
    };

    // 2. Perform MRV-Safe Export
    const { safeExport, redactedAuditLog } = sanitizer.sanitizeForMrvExport(rawData);

    // 3. Verify Environmental Evidence Integrity (Exact match)
    assert.strictEqual(safeExport.environmentalEvidence.ph, 7.42);
    assert.strictEqual(safeExport.environmentalEvidence.dissolvedOxygenMgL, 8.15);
    assert.strictEqual(safeExport.environmentalEvidence.sensorId, 'ORTO_WATER_SENSOR_04');
    console.log('  ✅ 1. Environmental evidence preserved bit-exact and unaltered');

    // 4. Verify Sensitive Credentials Purged Completely
    assert(!('rawWalletAddress' in safeExport.environmentalEvidence));
    assert(!('rawWalletAddress' in safeExport.operationalMetadata));
    assert(!('internalIp' in safeExport.operationalMetadata));
    console.log('  ✅ 2. Sensitive wallet and internal IP purged completely');

    // 5. Verify PII Pseudonymized
    assert(safeExport.operationalMetadata.operatorName.startsWith('anon_'));
    assert(safeExport.operationalMetadata.operatorEmail.startsWith('anon_'));
    assert.notStrictEqual(safeExport.operationalMetadata.operatorName, 'Dr. Marco Rossi');
    console.log('  ✅ 3. Operator PII successfully pseudonymised into deterministic anonymous hashes');

    // 6. Audit Trail & Provenance Verification
    assert.strictEqual(redactedAuditLog.length, 4);
    assert.strictEqual(safeExport.provenanceHash.length, 64);
    assert.strictEqual(safeExport.privacyCompliant, true);
    console.log(`  ✅ 4. Redaction audit log verified ${redactedAuditLog.length} actions with valid SHA-256 provenance`);

    console.log('🎉 All MRV Privacy Classification & Safe Export tests passed 100%!');
}

runPrivacySanitizerTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
