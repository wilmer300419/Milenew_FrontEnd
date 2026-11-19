module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:react/jsx-runtime', 'plugin:react-hooks/recommended'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
  settings: { react: { version: '18.3' } },
  ignorePatterns: ['dist', 'node_modules', 'backend', 'database', '.eslintrc.cjs', 'playwright-report', 'test-results'],
  rules: {
    'react/prop-types': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
  overrides: [
    { files: ['vite.config.js', 'playwright.config.js', 'e2e/**'], env: { node: true } },
    { files: ['public/sw.js'], env: { serviceworker: true } },
    { files: ['src/**/*.test.{js,jsx}', 'src/test/**'], env: { node: true }, globals: { vi: 'readonly' } },
  ],
}
