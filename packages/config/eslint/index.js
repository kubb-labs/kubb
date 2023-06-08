/** @type {import("eslint").Linter.Config} */
const config = {
  parser: "@typescript-eslint/parser",
  env: {
    commonjs: true,
    browser: true,
    es6: true,
    node: true,
    'vitest-globals/env': true,
  },
  extends: [
    "eslint:recommended", 
    "turbo",
    "prettier",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ],
  plugins: ['@typescript-eslint', 'vitest', 'vitest-globals', 'import'],
  rules:{
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/consistent-type-imports': 'warn',
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-floating-promises": "off",
    "@typescript-eslint/await-thenable": "off",
    "@typescript-eslint/restrict-template-expressions": "warn",
    "@typescript-eslint/no-unsafe-member-access": "warn",
    "@typescript-eslint/no-unsafe-call": "warn",
    "@typescript-eslint/no-unsafe-return": "warn",
    "@typescript-eslint/require-await": "warn",
    'arrow-body-style': 'off',
    'no-empty': 'off',
    '@typescript-eslint/ban-types': 'warn',
    camelcase: 'off',
    'global-require': 'off',
    'no-empty-pattern': 'warn',
    'no-debugger': 'off',
    'no-unused-vars': 'off',
    'no-plusplus': 'off',
    'no-redeclare': 'off',
    'no-undef': 'error',
    'no-continue': 'off',
    'no-shadow': 'off',
    'no-underscore-dangle': 'off',
    'no-use-before-define': 'off',
    'no-unused-expressions': 'off',
    'class-methods-use-this': 'off',
    'default-param-last': 'off',
    'no-restricted-exports': 'off',
    'no-constructor-return': 'off',
    'import/prefer-default-export': 'off',
    'import/no-dynamic-require': 'off',
    'react/display-name':"off",
    'import/no-extraneous-dependencies': 'off',
    'import/no-unresolved': 'off',
    "turbo/no-undeclared-env-vars": "off"
 },
 overrides: [
  {
    files: ["packages/**"],
    rules: {
      'import/extensions': [
        'warn',
        'ignorePackages',
        {
          js: 'always',
          jsx: 'always',
          ts: 'always',
          tsx: 'always',
        },
      ],
    },
  },
],
  ignorePatterns: [
    "**/dist/**",
    "**/mocks/**"
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2020,
    sourceType: 'module',
  }
};

module.exports = config;