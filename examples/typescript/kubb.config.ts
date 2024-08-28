import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import ts, { factory } from 'typescript'

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  hooks: {
    done: ['npm run typecheck', 'biome format --write ./', 'biome lint --apply-unsafe ./src'],
  },
  plugins: [
    pluginOas({ validate: false }),
    pluginTs({
      output: {
        path: 'models.ts',
        exportAs: 'models',
        exportType: false,
      },
      enumType: 'enum',
    }),
    pluginTs({
      output: {
        path: 'modelsConst.ts',
        exportAs: 'modelsAsConst',
        exportType: false,
      },
      enumType: 'asConst',
    }),
    pluginTs({
      output: {
        path: 'modelsPascalConst.ts',
        exportAs: 'modelsPascalConst',
        exportType: false,
      },
      enumType: 'asConst',
    }),
    pluginTs({
      output: {
        path: 'modelsConstEnum.ts',
        exportAs: 'modelsConstEnum',
        exportType: false,
      },
      enumType: 'constEnum',
    }),
    pluginTs({
      output: {
        path: 'modelsLiteral.ts',
        exportAs: 'modelsLiteral',
        exportType: false,
      },
      enumType: 'literal',
    }),
    pluginTs({
      output: {
        path: 'ts/models',
        exportType: 'barrelNamed',
      },
      oasType: 'infer',
      mapper: {
        category: factory.createPropertySignature(
          undefined,
          factory.createIdentifier('category'),
          factory.createToken(ts.SyntaxKind.QuestionToken),
          factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
        ),
      },
    }),
  ],
})
