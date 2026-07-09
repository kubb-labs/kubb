import { defineConfig } from 'oxlint'

export default defineConfig({
  plugins: ['typescript', 'react'],
  ignorePatterns: [
    '**/node_modules/**',
    '**/__snapshots__/**',
    '**/schemas/**',
    '**/tests/e2e/schemas/**',
    '**/coverage/**',
    '**/assets/**',
    '**/public/**',
    '**/dist/**',
    '**/artifacts/**',
    '**/.next/**',
    '**/.output/**',
    '**/.nitro/**',
    '**/CHANGELOG.md',
  ],
  rules: {
    'no-shadow-restricted-names': 'off',
    'no-empty-pattern': 'off',
    'no-unsafe-optional-chaining': 'off',
    'no-unused-private-class-members': 'off',
    'no-constructor-return': 'off',
    'no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    'typescript/no-this-alias': 'off',
    'no-else-return': 'error',
    'default-param-last': 'error',
    'prefer-exponentiation-operator': 'error',
    'typescript/array-type': ['error', { default: 'generic' }],
    'typescript/consistent-type-assertions': ['error', { assertionStyle: 'as', objectLiteralTypeAssertions: 'allow-as-parameter' }],
    'typescript/consistent-type-imports': ['error', { disallowTypeAnnotations: false }],
    'typescript/no-explicit-any': 'error',
    'typescript/no-inferrable-types': 'error',
    'typescript/prefer-function-type': 'error',
    'react/self-closing-comp': 'error',
    'react/no-array-index-key': 'warn',
  },
  overrides: [
    {
      // Test fixtures build partial or intentionally-invalid mock objects (`{ ... } as GeneratorContext`,
      // `undefined as any`) that a type annotation or `satisfies` cannot express, so assertions and
      // `any` are intentional there. The source rules stay strict.
      files: ['**/*.test.ts', '**/*.test.tsx'],
      rules: {
        'typescript/consistent-type-assertions': 'off',
        'typescript/no-explicit-any': 'off',
      },
    },
    {
      // Declaration files describe structural contracts (e.g. the JSX namespace) where `any`
      // is the idiomatic bound for heterogeneous component props.
      files: ['**/*.d.ts'],
      rules: {
        'typescript/no-explicit-any': 'off',
      },
    },
  ],
})
