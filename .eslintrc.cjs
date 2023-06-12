/**
 * Used for the `config`
 * @link https://eslint.org/docs/latest/use/configure/
 */

/** @type {import("eslint").Linter.Config} */
const config = {
  root: true,
  extends: ['@kubb'], // uses the config in `packages/config/eslint`
  parserOptions: {
    ecmaVersion: 'latest',
    tsconfigRootDir: __dirname,
    project: ['./examples/*/tsconfig.json', './docs/tsconfig.json', './packages/*/tsconfig.json'],
  },
}

module.exports = config
