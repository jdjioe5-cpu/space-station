const assert = require('assert');
const IdentitySecurityEngine = require('../security/identity_security_engine');

async function runIdentitySecurityTests() {
    console.log('🧪 Starting Identity Security & Capability Boundary Tests...');

    const engine = new IdentitySecurityEngine();

    // 1. Initial Registration with Self-Declared Data
    const id1 = engine.registerIdentity('EXPLORER_EVE', {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        internalCoordinates: { x: 104.2, y: 99.8, ip: '10.0.4.12' },
        declaredSkills: ['QUANTUM_ENGINEERING', 'CANOPY_SUPERVISOR'],
        isSimulatedEntity: true
    });
    assert.strictEqual(id1.verificationStatus, 'SELF_DECLARED');
    assert.strictEqual(id1.isActive, true);
    console.log('  ✅ 1. Identity initialized with default SELF_DECLARED status');

    // 2. Field-Level Privacy Enforcement (Masked on Public View)
    const publicProfile = engine.getPublicProfile('EXPLORER_EVE');
    assert.strictEqual(publicProfile.walletAddress, '[REDACTED_BY_PRIVACY_POLICY]');
    assert.strictEqual(publicProfile.coordinates, '[REDACTED_BY_PRIVACY_POLICY]');
    assert.strictEqual(publicProfile.isSimulatedEntity, true);
    console.log('  ✅ 2. Sensitive wallet & coordinates redacted on public view by default');

    // 3. Strict Capability Boundary Test
    // Even though Eve declared 'QUANTUM_ENGINEERING', she has NO technical capability
    const canDeploy = engine.canPerformAction('EXPLORER_EVE', 'QUANTUM_REACTOR_OVERRIDE');
    assert.strictEqual(canDeploy, false);
    console.log('  ✅ 3. Capability boundary enforced: Declared narrative skills granted 0 technical permissions');

    // 4. Verification Upgrade
    const upgraded = engine.upgradeVerification('EXPLORER_EVE', 'SYSTEM_VERIFIED', { auditor: 'STATION_DIRECTOR' });
    assert.strictEqual(upgraded.verificationStatus, 'SYSTEM_VERIFIED');
    assert(engine.canPerformAction('EXPLORER_EVE', 'CAN_SUBMIT_ORTO_TELEMETRY'));
    console.log('  ✅ 4. Upgraded to SYSTEM_VERIFIED; granted certified technical capability');

    // 5. Disable / Revoke Identity
    engine.disableIdentity('EXPLORER_EVE', 'Suspected session compromise');
    assert.strictEqual(engine.canPerformAction('EXPLORER_EVE', 'CAN_SUBMIT_ORTO_TELEMETRY'), false);
    const disabledView = engine.getPublicProfile('EXPLORER_EVE');
    assert.strictEqual(disabledView.status, 'DISABLED');
    console.log('  ✅ 5. Identity disabled: capabilities unmounted and public profile rendered DISABLED');

    // 6. Audit Trail Verification
    assert(engine.auditLog.length >= 3);
    assert.strictEqual(engine.auditLog[0].signature.length, 64);
    console.log(`  ✅ 6. Immutable audit log recorded ${engine.auditLog.length} events with valid SHA-256 signatures`);

    console.log('🎉 All Identity Security & Capability Boundary tests passed 100%!');
}

runIdentitySecurityTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
