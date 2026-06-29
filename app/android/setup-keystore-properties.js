/**
 * Documents Android release keystore location and SHA fingerprints for Firebase / Play Console.
 * Passwords live in android/keystore.properties (gitignored).
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const androidDir = __dirname;
const propsPath = path.join(androidDir, 'keystore.properties');
const rootKeystore = path.resolve(androidDir, '../../tray-release.keystore');

if (!fs.existsSync(propsPath)) {
  console.error('❌ keystore.properties not found at app/android/keystore.properties');
  console.error('   Generate tray-release.keystore at repo root first.');
  process.exit(1);
}

const props = fs.readFileSync(propsPath, 'utf8');
const storePass = props.match(/MYAPP_RELEASE_STORE_PASSWORD=(.+)/)?.[1]?.trim();
const keyAlias = props.match(/MYAPP_RELEASE_KEY_ALIAS=(.+)/)?.[1]?.trim();

if (!storePass || !keyAlias) {
  console.error('❌ keystore.properties is missing password or alias fields.');
  process.exit(1);
}

console.log('Tray Android release keystore');
console.log(`  File: ${rootKeystore}`);
console.log(`  Alias: ${keyAlias}`);
console.log('');

try {
  const out = execSync(
    `keytool -list -v -keystore "${rootKeystore}" -alias "${keyAlias}" -storepass "${storePass}"`,
    { encoding: 'utf8' },
  );
  const sha1 = out.match(/SHA1:\s*(.+)/)?.[1]?.trim();
  const sha256 = out.match(/SHA256:\s*(.+)/)?.[1]?.trim();
  if (sha1) console.log(`  SHA-1:   ${sha1}`);
  if (sha256) console.log(`  SHA-256: ${sha256}`);
} catch (error) {
  console.error('❌ Failed to read keystore fingerprints:', error.message);
  process.exit(1);
}
