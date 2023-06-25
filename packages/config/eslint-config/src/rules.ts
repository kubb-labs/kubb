import type { Linter } from 'eslint'

export const rules: Linter.FlatConfig['rules'] = {
  /**
   * Should be set before `unused-imports` rules are getting used
   * @link https://github.com/sweepline/eslint-plugin-unused-imports
   */
  '@typescript-eslint/no-unused-vars': ['warn', { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' }],
  '@typescript-eslint/no-var-requires': 'off',
  '@typescript-eslint/explicit-module-boundary-types': 'warn',
  // type imports should be imported as types
  '@typescript-eslint/consistent-type-imports': [
    'error',
    {
      prefer: 'type-imports',
      fixStyle: 'separate-type-imports',
      disallowTypeAnnotations: false,
    },
  ],
  '@typescript-eslint/no-unsafe-assignment': 'warn',
  '@typescript-eslint/no-floating-promises': 'off',
  '@typescript-eslint/await-thenable': 'off',
  '@typescript-eslint/require-await': 'off',
  '@typescript-eslint/restrict-template-expressions': 'warn',
  '@typescript-eslint/no-unsafe-member-access': 'warn',
  '@typescript-eslint/no-unsafe-call': 'warn',
  '@typescript-eslint/no-unsafe-return': 'warn',
  '@typescript-eslint/ban-types': 'error',
  '@typescript-eslint/no-misused-promises': 'off',
  camelcase: 'off',
  'global-require': 'off',
  'no-empty-pattern': 'warn',
  'no-debugger': 'error',
  'no-constant-condition': 'off',
  'default-param-last': 'error',
  'no-restricted-exports': 'off',
  'no-constructor-return': 'off',
  'import/prefer-default-export': 'off',
  'import/no-dynamic-require': 'off',
  'import/no-extraneous-dependencies': 'off',
  'import/no-unresolved': 'off',
  'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
  'turbo/no-undeclared-env-vars': 'off',
  'unused-imports/no-unused-imports': 'error',
  'unused-imports/no-unused-vars': ['warn', { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' }],
  'react/jsx-uses-vars': 'error',
  'react/display-name': 'off',
  /**
   * @link https://legacy.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html#eslint
   */
  'react/jsx-uses-react': 'off',
  'react/react-in-jsx-scope': 'off',
}
export default rules
