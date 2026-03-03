import fs from 'fs';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const manifestJson = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));

const newVersion = process.argv[2];

if (!newVersion) {
    console.error('No version provided');
    process.exit(1);
}

packageJson.version = newVersion;
manifestJson.version = newVersion;

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
fs.writeFileSync('manifest.json', JSON.stringify(manifestJson, null, 2));

console.log(`Version bumped to ${newVersion}`);