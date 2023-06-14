import { ImportsGenerator } from './ImportsGenerator.ts'

describe('ImportsGenerator', () => {
  test('if ImportsGenerator can be created', () => {
    const importsGenerator = new ImportsGenerator()

    expect(importsGenerator).toBeDefined()

    importsGenerator.add({
      path: 'path',
      ref: {
        originalName: 'originalName',
        propertyName: 'propertyName',
      },
    })

    const importMeta = importsGenerator.build([])
    expect(importMeta).toEqual([
      {
        path: 'path',
        ref: {
          originalName: 'originalName',
          propertyName: 'propertyName',
        },
      },
    ])
  })
})
