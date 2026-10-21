// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    // jest.isolateModules needs require() to load fresh module instances.
    files: ['**/__tests__/**'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    ignores: ['dist/*', '.expo/*', 'ios/*', 'android/*'],
  },
]);
