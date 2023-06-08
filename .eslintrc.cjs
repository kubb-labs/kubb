/** @type {import("eslint").Linter.Config} */
const config = {
  root: true,
  extends: ['@kubb'], // uses the config in `packages/config/eslint`
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    tsconfigRootDir: __dirname,
    project: ['./examples/*/tsconfig.json', './docs/tsconfig.json', './packages/*/tsconfig.json'],
  },
  settings: {
    next: {
      rootDir: ['docs/*/'],
    },
  },
}

module.exports = config
