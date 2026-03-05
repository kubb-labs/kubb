import { expect, test } from 'vitest'
import * as factory from '../src/factory.ts'
import { safePrint } from '@kubb/fabric-core/parsers/typescript'

test('empty enum with asConst', () => {
  const [nameNode, typeNode] = factory.createEnumDeclaration({
    name: 'actionType',
    typeName: 'ActionTypeKey',
    enums: [],
    type: 'asConst',
    enumKeyCasing: 'none'
  })
  
  console.log('nameNode:', nameNode)
  console.log('typeNode:', typeNode)
  console.log('nameNode truthy:', !!nameNode)
  
  if (nameNode) {
    const printed = safePrint(nameNode)
    console.log('printed nameNode:', JSON.stringify(printed))
  }
  
  const printedTypeNode = safePrint(typeNode)
  console.log('printed typeNode:', JSON.stringify(printedTypeNode))
  
  expect(nameNode).toBeDefined()
})
