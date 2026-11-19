module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:react/jsx-runtime', 'plugin:react-hooks/recommended'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
  settings: { react: { version: '18.3' } },
  ignorePatterns: ['dist', 'node_modules', 'backend', 'database', '.eslintrc.cjs'],
  rules: {
    'react/prop-types': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
  overrides: [
    { files: ['vite.config.js'], env: { node: true } },
    { files: ['src/**/*.test.{js,jsx}', 'src/test/**'], env: { node: true }, globals: { vi: 'readonly' } },
  ],
}
