import type { Config } from 'jest'

const config: Config = {
  rootDir: '..',
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  globals: {
    jest: true,
  },
  testRegex: 'src/.*\\.test\\.ts$',
  modulePathIgnorePatterns: ['__vitest__'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  coverageReporters: ['json-summary', 'text', 'lcov'],
  setupFilesAfterEnv: ['<rootDir>/configs/setup.ts'],
}

export default config
