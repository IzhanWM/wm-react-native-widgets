#!/usr/bin/env node
/**
 * Compiles the widget library in components/ into dist/npm-packages/widgets.
 *
 * Each widget keeps its own flat subpath in the output
 * (@wavemaker/react-native-widgets/qrcode, .../avatarstack, ...), and
 * components/index.ts becomes the package entrypoint.
 *
 * Platform variants (`*.web.tsx`) compile to `*.web.js` beside their native
 * sibling, so Metro and web bundlers resolve the right one per platform.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = process.cwd();
const outDir = path.join(root, 'dist', 'npm-packages', 'widgets');

const log = (msg, ...args) => console.log(`[build-lib] ${msg}`, ...args);

function run() {
  log('Compiling components/ -> dist/npm-packages/widgets');
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true });
  }
  fs.mkdirSync(outDir, { recursive: true });

  execSync('npx tsc -p tsconfig.lib.json', { cwd: root, stdio: 'inherit' });

  log('Done. Output in dist/npm-packages/widgets');
}

run();
