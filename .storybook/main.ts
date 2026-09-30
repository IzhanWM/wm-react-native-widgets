// This file has been automatically migrated to valid ESM format by Storybook.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from '@storybook/react-vite';
import { transformAsync } from '@babel/core';
import { mergeConfig, transformWithEsbuild } from 'vite';
import path, { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Code that declares Reanimated worklets: the two gesture widgets, and the libraries under
 * them. Reanimated v4 worklets only work once the worklets Babel plugin has run over the code
 * that declares them, Reanimated's own included. Metro does that through babel-preset-expo;
 * Vite has no Babel step, so both passes below run it on just these files.
 */
const WORKLET_SOURCES =
  /(components\/(swipedeck|reorderlist)\/[^/]+\.tsx?|node_modules\/(react-native-reanimated|react-native-worklets|react-native-reorderable-list)\/.+\.[jt]sx?)$/;

const workletize = async (code: string, file: string) => {
  const result = await transformAsync(code, {
    filename: file,
    babelrc: false,
    configFile: false,
    sourceMaps: true,
    parserOpts: { plugins: ['jsx', 'typescript'] },
    plugins: ['react-native-worklets/plugin'],
  });
  return result?.code ? result : null;
};

const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-docs'],

  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  async viteFinal(config) {
    return mergeConfig(config, {
      base: process.env.STORYBOOK_BASE_PATH || '/',
      resolve: {
        // Prefer *.web.js (e.g. react-native-gesture-handler) over native RN files.
        extensions: [
          '.web.mjs',
          '.web.js',
          '.web.jsx',
          '.web.ts',
          '.web.tsx',
          '.mjs',
          '.js',
          '.mts',
          '.ts',
          '.jsx',
          '.tsx',
          '.json',
        ],
        alias: {
          '@': path.resolve(__dirname, '../'),
          '@components': path.resolve(__dirname, '../components'),
          '@stories': path.resolve(__dirname, '../stories'),
          // Before `react-native` → web: RN paths that exist on native but not on react-native-web.
          'react-native/Libraries/Utilities/codegenNativeComponent': path.resolve(
            __dirname,
            './shims/codegenNativeComponent.js'
          ),
          'react-native/Libraries/Pressability/PressabilityDebug': path.resolve(
            __dirname,
            './shims/PressabilityDebug.js'
          ),
          'react-native': 'react-native-web',
          'react-native/Libraries/Image/AssetRegistry': 'react-native-web/dist/modules/AssetRegistry',
        },
      },
      optimizeDeps: {
        exclude: ['react-native', '@shopify/react-native-skia'],
        include: ['react-native-web'],
        esbuildOptions: {
          resolveExtensions: ['.web.js', '.web.jsx', '.web.ts', '.web.tsx', '.js', '.jsx', '.ts', '.tsx'],
          // react-native-qrcode-svg (and similar RN packages) ship JSX in .js files.
          loader: { '.js': 'jsx' },
          plugins: [
            {
              // Dev pre-bundling bypasses Vite plugins, so worklet sources get the pass here.
              name: 'reanimated-worklets',
              setup(build) {
                build.onLoad({ filter: WORKLET_SOURCES }, async ({ path: file }) => {
                  const result = await workletize(await readFile(file, 'utf8'), file);
                  // Babel leaves types in place, so TypeScript sources stay on the tsx loader.
                  const loader = /\.tsx?$/.test(file) ? 'tsx' : 'jsx';
                  return result ? { contents: result.code!, loader } : undefined;
                });
              },
            },
          ],
        },
      },
      build: {
        commonjsOptions: {
          transformMixedEsModules: true,
        },
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        __DEV__: JSON.stringify(true),
      },
      server: {
        fs: {
          allow: ['..'],
        },
      },
      plugins: [
        {
          // react-native-qrcode-svg (and similar RN packages) ship JSX inside
          // plain .js files. optimizeDeps' loader covers dev pre-bundling only,
          // so the production build needs the same transform to parse them.
          name: 'rn-jsx-in-js',
          enforce: 'pre',
          async transform(code: string, id: string) {
            if (!/node_modules\/react-native-qrcode-svg\/.*\.js$/.test(id)) return null;
            return transformWithEsbuild(code, id, { loader: 'jsx', jsx: 'automatic' });
          },
        },
        {
          // Worklet sources Vite serves itself (our components in dev, everything in a build).
          name: 'reanimated-worklets',
          enforce: 'pre',
          async transform(code: string, id: string) {
            const file = id.split('?')[0]; // Vite appends ?v=<hash> to node_modules files
            if (!WORKLET_SOURCES.test(file)) return null;
            const result = await workletize(code, file);
            return result ? { code: result.code!, map: result.map } : null;
          },
        },
        {
          name: 'storybook-mdx-shim-resolve',
          enforce: 'pre',
          resolveId(id) {
            if (id.includes('mdx-react-shim')) {
              return path.resolve(
                __dirname,
                '../node_modules/@storybook/addon-docs/dist/mdx-react-shim.js'
              );
            }
            return null;
          },
        },
        {
          name: 'ignore-react-native-flow',
          enforce: 'pre',
          resolveId(id) {
            // Ignore react-native files that contain Flow syntax
            if (id.includes('react-native') && !id.includes('react-native-web')) {
              if (id.includes('node_modules/react-native')) {
                return { id: 'react-native-web', external: false };
              }
            }
            return null;
          },
          load(id) {
            // Skip loading react-native files with Flow syntax
            if (id.includes('node_modules/react-native') && !id.includes('react-native-web')) {
              if (id.endsWith('.js.flow') || id.includes('/Libraries/')) {
                return 'export default {};';
              }
            }
            return null;
          },
        },
      ],
    });
  }
};

export default config;
