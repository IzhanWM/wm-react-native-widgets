// Flat config. See https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'storybook-static/*', 'expo-app/*'],
  },
  {
    // Build scripts are CommonJS run by Node, not React Native modules.
    files: ['scripts/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { __dirname: 'readonly', process: 'readonly', module: 'writable', require: 'readonly' },
    },
  },
  {
    // A story's `render` is a component in everything but name, so hooks inside
    // it are the documented Storybook pattern, not a rules-of-hooks violation.
    files: ['stories/**/*.stories.tsx'],
    rules: { 'react-hooks/rules-of-hooks': 'off' },
  },
]);
