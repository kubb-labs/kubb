/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export default {
  roots: ['<rootDir>'],
  projects: ['<rootDir>/packages/*/jest.config.ts'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  coveragePathIgnorePatterns: ['/node_modules/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleDirectories: ['node_modules'],
  modulePathIgnorePatterns: ['/build/', '/lib/', '/dist/', '/es/'],
  testRegex: 'src/.*.(test|spec).(jsx?|tsx?)?$',
  collectCoverage: false,
  coverageDirectory: 'test-results/code-coverage',
  coverageReporters: ['clover', 'json', 'lcov', 'text', 'cobertura'],
}
