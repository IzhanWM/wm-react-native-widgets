const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const root = process.cwd();
const componentsDir = path.join(root, 'components');
const wmxDir = path.join(root, 'wmx');

const defaultWmxDir = path.join(root, 'dist', 'wmx', 'widgets');

/** Optional directory to receive copies of generated zip files (--o= or positional). */
const parseZipCopyDestDir = () => {
  const argv = process.argv.slice(2);
  for (const arg of argv) {
    const m = /^--o=(.*)$/.exec(arg);
    if (m && m[1] !== '') {
      return path.resolve(root, m[1]);
    }
  }
  const first = argv[0];
  if (first && !first.startsWith('-')) {
    return path.resolve(root, first);
  }
  return null;
};

const zipCopyDestDir = parseZipCopyDestDir();

const findWmxJsonFiles = (dir, handleFile) => {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findWmxJsonFiles(filePath, handleFile);
    } else if (file === 'wmx.json') {
      handleFile(filePath);
    }
  });
};

const log = (msg, ...args) => console.log(`[generate-wmx] ${msg}`, ...args);

/** Keys written to dist package.json (npm metadata only). */
const PACKAGE_JSON_KEYS = [
  'name',
  'version',
  'license',
  'repository',
  'homepage',
  'dependencies',
  'keywords',
  'displayName',
  'description'
];

/** WMX manifest fields that are not duplicated package.json metadata. */
const WMX_BODY_KEYS = [
  'name',
  'displayName',
  'description',
  'version',
  'iconUrl',
  'webSupport',
  'props', 
  'events',
  'styles',
];

/**
 * Split a flat wmx.json (package + chart schema in one file) into package.json vs wmx.json outputs.
 */
const splitFlatWmxSource = (raw) => {
  const packageJSON = {};
  for (const key of PACKAGE_JSON_KEYS) {
    if (raw[key] !== undefined) {
      packageJSON[key] = raw[key];
    }
  }

  const wmxJSON = {};
  for (const key of WMX_BODY_KEYS) {
    if (raw[key] !== undefined) {
      wmxJSON[key] = raw[key];
    }
  }
  wmxJSON.name = raw.name;
  wmxJSON.version = raw.version;
  wmxJSON.displayName = raw.displayName;
  wmxJSON.description = raw.description;
  wmxJSON.iconUrl = raw.iconUrl;
  wmxJSON.webSupport = raw.webSupport !== false;

  return { packageJSON, wmxJSON };
};

const generateWMXZip = (wmxJsonPath, destBaseDir) => {
  log('Reading %s', wmxJsonPath);
  const wmxSrcDir = path.dirname(wmxJsonPath);
  const raw = JSON.parse(fs.readFileSync(wmxJsonPath, 'utf8'));
  let { packageJSON, wmxJSON } = splitFlatWmxSource(raw);
  const pkgOutDir = path.join(destBaseDir, packageJSON.name);
  fs.mkdirSync(pkgOutDir, { recursive: true });
  fs.writeFileSync(path.join(pkgOutDir, 'package.json'), JSON.stringify(packageJSON, null, 2));
  fs.copyFileSync(path.join(wmxSrcDir, wmxJSON.iconUrl), path.join(pkgOutDir, 'icon.svg'));
  fs.writeFileSync(path.join(pkgOutDir, 'wmx.json'), JSON.stringify(wmxJSON, null, 2));
  const indexTsxPath = path.join(wmxSrcDir, 'index.tsx');
  if (fs.existsSync(indexTsxPath)) {
    fs.copyFileSync(indexTsxPath, path.join(pkgOutDir, 'index.tsx'));
  }
  wmxJSON.preview?.forEach(preview => {
    fs.copyFileSync(path.join(wmxSrcDir, preview), path.join(pkgOutDir, preview));
  });
  const wmxZipPath = path.join(destBaseDir, packageJSON.name + '.zip');
  fs.mkdirSync(path.dirname(wmxZipPath), { recursive: true });
  const zip = new AdmZip();
  zip.addLocalFolder(pkgOutDir);
  zip.writeZip(wmxZipPath);
  log('Built %s (%s) -> %s', packageJSON.name, packageJSON.version, wmxZipPath);
};

const copyZipFilesToDir = (fromDir, toDir) => {
  fs.mkdirSync(toDir, { recursive: true });
  const names = fs.readdirSync(fromDir).filter((n) => n.endsWith('.zip'));
  for (const name of names) {
    fs.copyFileSync(path.join(fromDir, name), path.join(toDir, name));
  }
  log('Copied %d zip file(s) to %s', names.length, toDir);
};

const generateWMX = () => {
  log(
    'Starting WMX generation (sources: wmx + components, output: %s%s)',
    defaultWmxDir,
    zipCopyDestDir ? `, zip copy: ${zipCopyDestDir}` : ''
  );
  if (fs.existsSync(defaultWmxDir)) {
    log('Cleaning default output directory');
    fs.rmSync(defaultWmxDir, { recursive: true });
  }
  fs.mkdirSync(defaultWmxDir, { recursive: true });
  let count = 0;
  [wmxDir, componentsDir].forEach((dir) => {
    if (fs.existsSync(dir)) {
      findWmxJsonFiles(dir, (filePath) => {
        generateWMXZip(filePath, defaultWmxDir);
        count++;
      });
    }
  });
  if (
    zipCopyDestDir &&
    path.resolve(zipCopyDestDir) !== path.resolve(defaultWmxDir)
  ) {
    copyZipFilesToDir(defaultWmxDir, zipCopyDestDir);
  }
  log('Done. Generated %d WMX package(s)', count);
};

generateWMX();