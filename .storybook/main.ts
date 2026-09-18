// This file has been automatically migrated to valid ESM format by Storybook.
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig, transformWithEsbuild } from 'vite';
import path, { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
