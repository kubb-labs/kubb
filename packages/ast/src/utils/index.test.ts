import { describe, expect, it } from 'vitest'
import * as utils from './index.ts'

describe('@kubb/ast/utils barrel', () => {
  it('exports a stable set of value names', () => {
    expect(Object.keys(utils).sort()).toStrictEqual([
      'buildGroupParam',
      'buildJSDoc',
      'buildList',
      'buildObject',
      'buildTypeLiteral',
      'caseParams',
      'childName',
      'collectUsedSchemaNames',
      'containsCircularRef',
      'enumPropName',
      'extractRefName',
      'extractStringsFromNodes',
      'findCircularSchemas',
      'findDiscriminator',
      'getNestedAccessor',
      'isStringType',
      'isValidVarName',
      'jsStringEscape',
      'objectKey',
      'resolveGroupType',
      'resolveParamType',
      'stringify',
      'stringifyObject',
      'syncSchemaRef',
      'toRegExpString',
      'trimQuotes',
    ])
  })
})
