import type { Linter } from 'eslint'

export const rules: Linter.FlatConfig['rules'] = {
  /**
   * Should be set before `unused-imports` rules are getting used
   * @link https://github.com/sweepline/eslint-plugin-unused-imports
   */
  '@typescript-eslint/no-unused-vars': ['warn', { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' }],
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/no-namespace': 'off',
  '@typescript-eslint/no-var-requires': 'off',
  '@typescript-eslint/explicit-module-boundary-types': 'off',
  // type imports should be imported as types
  '@typescript-eslint/consistent-type-imports': [
    'error',
    {
      prefer: 'type-imports',
      fixStyle: 'separate-type-imports',
      disallowTypeAnnotations: false,
    },
  ],
  '@typescript-eslint/no-unsafe-assignment': 'off',
  '@typescript-eslint/no-floating-promises': 'off',
  '@typescript-eslint/await-thenable': 'off',
  '@typescript-eslint/restrict-template-expressions': 'warn',
  '@typescript-eslint/no-unsafe-member-access': 'warn',
  '@typescript-eslint/no-unsafe-call': 'warn',
  '@typescript-eslint/no-unsafe-return': 'warn',
  '@typescript-eslint/require-await': 'off',
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
  'react/display-name': 'off',
  'import/no-extraneous-dependencies': 'off',
  'import/no-unresolved': 'off',
  'turbo/no-undeclared-env-vars': 'off',
  'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
  'unused-imports/no-unused-imports': 'error',
  'unused-imports/no-unused-vars': ['warn', { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' }],
  /**
   * If writing react code you need to install eslint-plugin-react and enable the two rules react/jsx-uses-react and react/jsx-uses-vars. Otherwise all imports for components will be reported unused.
   * @link https://github.com/sweepline/eslint-plugin-unused-imports
   */
  'react/jsx-uses-react': 'error',
  'react/jsx-uses-vars': 'error',
}
