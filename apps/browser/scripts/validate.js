const fs = require('fs');
const path = require('path');

console.log('Validating Tera Browser v0.1.0...\n');

// Check for Xplorer-derived content
const xplorerPatterns = [
  'xplorer',
  'grok',
  'xai',
  'chromium derivative',
  'companion/ui',
  'xbrowser',
  'grok-build',
  'grok-toolbar',
  'grok_companion'
];

const browserDir = path.join(__dirname, '..');
let hasIssues = false;

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
    for (const pattern of xplorerPatterns) {
      if (content.includes(pattern)) {
        console.log(`❌ Found "${pattern}" in ${filePath}`);
        hasIssues = true;
      }
    }
  } catch (err) {
    // File doesn't exist or can't be read, skip
  }
}

function checkDirectory(dir) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        checkDirectory(filePath);
      } else if (stat.isFile()) {
        checkFile(filePath);
      }
    }
  } catch (err) {
    // Directory doesn't exist, skip
  }
}

// Check required files exist
const requiredFiles = [
  'src/main.js',
  'src/preload.js',
  'src/newtab.html',
  'src/newtab.css',
  'src/newtab.js',
  'src/browser.css',
  'package.json',
  'README.md',
  'CHANGELOG.md'
];

console.log('Checking required files...');
for (const file of requiredFiles) {
  const filePath = path.join(browserDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`✓ ${file}`);
  } else {
    console.log(`❌ Missing ${file}`);
    hasIssues = true;
  }
}

// Check for Xplorer-derived content
console.log('\nChecking for Xplorer-derived content...');
checkDirectory(path.join(browserDir, 'src'));
checkDirectory(path.join(browserDir, 'public'));

// Check package.json
console.log('\nChecking package.json...');
const packageJson = JSON.parse(fs.readFileSync(path.join(browserDir, 'package.json'), 'utf8'));
console.log(`✓ Name: ${packageJson.name}`);
console.log(`✓ Version: ${packageJson.version}`);
console.log(`✓ License: ${packageJson.license}`);

// Check that no Xplorer folders exist
const forbiddenDirs = ['companion', 'branding'];
console.log('\nChecking for forbidden directories...');
for (const dir of forbiddenDirs) {
  const dirPath = path.join(browserDir, dir);
  if (fs.existsSync(dirPath)) {
    console.log(`❌ Found forbidden directory: ${dir}`);
    hasIssues = true;
  } else {
    console.log(`✓ No ${dir} directory`);
  }
}

console.log('\n' + '='.repeat(50));
if (hasIssues) {
  console.log('❌ Validation FAILED - Xplorer-derived content detected');
  process.exit(1);
} else {
  console.log('✓ Validation PASSED - No Xplorer-derived content detected');
  process.exit(0);
}
