import type { Config } from 'jest'

import { pathsToModuleNameMapper } from 'ts-jest'

import baseConfig from '../../jest.config'

const tsconfig = require('./tsconfig.json')

const packageName = 'swagger-react-query'

export default {
  ...baseConfig,
  rootDir: '../..',
  roots: [`<rootDir>/packages/${packageName}`],
  displayName: packageName,
  globals: {},
  moduleNameMapper: {
    ...pathsToModuleNameMapper(tsconfig.compilerOptions.paths, { prefix: `<rootDir>/packages/${packageName}` }),
  },
} as Config
