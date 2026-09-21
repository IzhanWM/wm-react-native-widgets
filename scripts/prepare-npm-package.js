#!/usr/bin/env node
/**
 * Turns the compiled output in dist/npm-packages/widgets into a publishable
 * package: writes its package.json, copies README/LICENSE, and adds .npmignore.
 *
 * Run after `npm run build:lib`. Both steps together: `npm run generate:package`.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = process.cwd();
const outDir = path.join(root, 'dist', 'npm-packages', 'widgets');

const log = (msg, ...args) => console.log(`[prepare-npm-package] ${msg}`, ...args);

/** Runtime deps the published package installs for the consumer. */
const RUNTIME_DEPS = [
  'react-native-qrcode-svg',
  'react-native-reorderable-list',
  'react-native-signature-canvas',
];

/**
 * Left to the host app so versions are not duplicated. Skia (SkiaEffect) and
 * WebView (native SignaturePad) are optional: a consumer using neither widget,
 * or running on web only, should not be forced to install them.
 */
const PEER_DEPS = [
  'react-native-svg',
  'react-native-gesture-handler',
  'react-native-reanimated',
  '@shopify/react-native-skia',
  'react-native-webview',
];

const OPTIONAL_PEER_DEPS = ['@shopify/react-native-skia', 'react-native-webview'];

function ensureBuilt() {
  if (!fs.existsSync(path.join(outDir, 'index.js'))) {
    log('No build found in dist/npm-packages/widgets. Run "npm run build:lib" first.');
    return false;
  }
  return true;
}

function buildPackageJson() {
  const rootPkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const allDeps = { ...(rootPkg.dependencies || {}), ...(rootPkg.devDependencies || {}) };
  const rootPeers = rootPkg.peerDependencies || {};

  const dependencies = {};
  for (const dep of RUNTIME_DEPS) {
    if (allDeps[dep]) dependencies[dep] = allDeps[dep];
  }

  const peerDependencies = {
    react: rootPeers.react || '*',
    'react-native': rootPeers['react-native'] || '*',
  };
  for (const dep of PEER_DEPS) {
    peerDependencies[dep] = rootPeers[dep] || allDeps[dep] || '*';
  }

  const peerDependenciesMeta = {};
  for (const dep of OPTIONAL_PEER_DEPS) {
    peerDependenciesMeta[dep] = { optional: true };
  }

  return {
    name: rootPkg.name,
    version: rootPkg.version,
    description: rootPkg.description,
    license: rootPkg.license,
    repository: rootPkg.repository,
    homepage: rootPkg.homepage,
    keywords: rootPkg.keywords,
    main: 'index.js',
    types: 'index.d.ts',
    files: ['*'],
    peerDependencies,
    peerDependenciesMeta,
    dependencies,
    private: false,
  };
}

function copyOptional(fileName) {
  const src = path.join(root, fileName);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(outDir, fileName));
    log('Copied %s', fileName);
  }
}

function writeNpmIgnore() {
  fs.writeFileSync(
    path.join(outDir, '.npmignore'),
    ['# Source and dev', '*.map', '*.tgz', '.DS_Store', ''].join('\n')
  );
  log('Created .npmignore');
}

function isYalcAvailable() {
  try {
    execSync(process.platform === 'win32' ? 'where yalc' : 'command -v yalc', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function run() {
  log('Preparing npm package in dist/npm-packages/widgets/');
  if (!ensureBuilt()) process.exit(1);

  const pkg = buildPackageJson();
  fs.writeFileSync(path.join(outDir, 'package.json'), JSON.stringify(pkg, null, 2));
  log('Wrote package.json (name=%s, version=%s)', pkg.name, pkg.version);

  copyOptional('README.md');
  copyOptional('LICENSE');
  writeNpmIgnore();

  log('Done. To publish: cd dist/npm-packages/widgets && npm publish');

  if (isYalcAvailable()) {
    execSync('yalc publish', { stdio: 'inherit', cwd: outDir });
    log('Published to yalc. In your app: yalc add %s', pkg.name);
  } else {
    log('Skipping yalc (not on PATH). Install globally: npm i -g yalc');
  }
}

run();
