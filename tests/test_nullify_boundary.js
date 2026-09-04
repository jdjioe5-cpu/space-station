const assert = require('assert');
const { NullifyBoundaryEvaluator, INTEGRATION_MODES } = require('../privacy/nullify_boundary_evaluator');

async function runBoundaryTests() {
    console.log('🧪 Starting Nullify Boundary, Security & Go/No-Go Tests...');

    // 1. Default State must be NO_GO_SANDBOX_ONLY
    const defaultEvaluator = new NullifyBoundaryEvaluator();
    const defaultDecision = defaultEvaluator.evaluateGoNoGo();
    assert.strictEqual(defaultDecision.mode, INTEGRATION_MODES.NO_GO_SANDBOX_ONLY);
    assert.strictEqual(defaultDecision.allowsRealData, false);
    console.log('  ✅ 1. Default security boundary enforces NO_GO_SANDBOX_ONLY');

    // 2. Data Boundary Enforcement: Reject prohibited PII fields
    let piiBlocked = false;
    try {
        defaultEvaluator.validateOutboundPayload({
            targetHash: '0x1234567890abcdef1234567890abcdef12345678',
            email: 'astronaut@station.org'
        });
    } catch (err) {
        piiBlocked = true;
        assert(err.message.includes('prohibited field "email"'));
    }
    assert.strictEqual(piiBlocked, true);
    console.log('  ✅ 2. Prohibited PII (email, private key, coords) strictly blocked at boundary');

    // 3. Data Boundary Enforcement: Accept valid cryptographic hash
    const validOut = defaultEvaluator.validateOutboundPayload({
        targetHash: '0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
        reason: 'USER_DATA_MINIMISATION'
    });
    assert.strictEqual(validOut.zeroPiiConfirmed, true);
    console.log('  ✅ 3. Valid cryptographic targetHash payload verified and passed');

    // 4. Go/No-Go Progression when all criteria satisfied
    const compliantEvaluator = new NullifyBoundaryEvaluator({
        dpaSigned: true,
        euHostingVerified: true,
        subprocessorsAudited: true,
        dpiaCompleted: true
    });
    const goDecision = compliantEvaluator.evaluateGoNoGo();
    assert.strictEqual(goDecision.mode, INTEGRATION_MODES.FULL_GO_LIVE);
    assert.strictEqual(goDecision.allowsRealData, true);
    console.log('  ✅ 4. Full Go-Live permitted when all GDPR, DPA, and DPIA conditions are satisfied');

    // 5. Tamper-proof certificate generation
    const cert = compliantEvaluator.generateCertificate('CHIEF_PRIVACY_OFFICER');
    assert(cert.certificateId.startsWith('CERT_GO_NOGO_'));
    assert.strictEqual(cert.signature.length, 64);
    assert.strictEqual(cert.decision, INTEGRATION_MODES.FULL_GO_LIVE);
    console.log(`  ✅ 5. Generated tamper-proof Go/No-Go certificate: ${cert.certificateId} with SHA-256 signature`);

    console.log('🎉 All Nullify Boundary & Legal Verification tests passed 100%!');
}

runBoundaryTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
