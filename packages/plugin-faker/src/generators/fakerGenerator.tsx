import { type OperationSchema as OperationSchemaType, SchemaGenerator, createReactGenerator } from '@kubb/plugin-oas'
import { Oas } from '@kubb/plugin-oas/components'
import { useOas, useOperationManager, useSchemaManager } from '@kubb/plugin-oas/hooks'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, useApp } from '@kubb/react'
import { Faker } from '../components'
import { pluginFakerName } from '../plugin.ts'
import type { PluginFaker } from '../types'

export const fakerGenerator = createReactGenerator<PluginFaker>({
  name: 'plugin-faker',
  Operation({ operation }) {
    const {
      plugin: {
        options: { dateParser, regexGenerator, seed, mapper },
      },
    } = useApp<PluginFaker>()
    const { plugin, pluginManager, mode } = useApp<PluginFaker>()
    const oas = useOas()
    const { getSchemas, getFile } = useOperationManager()
    const { getImports } = useSchemaManager()

    const file = getFile(operation)
    const schemas = getSchemas(operation)
    const schemaGenerator = new SchemaGenerator(plugin.options, {
      oas,
      plugin,
      pluginManager,
      mode,
      override: plugin.options.override,
    })

    const operationSchemas = [schemas.pathParams, schemas.queryParams, schemas.headerParams, schemas.statusCodes, schemas.request, schemas.response]
      .flat()
      .filter(Boolean)

    const mapOperationSchema = ({ name, schema, description, ...options }: OperationSchemaType, i: number) => {
      const resolvedName = pluginManager.resolveName({
        name,
        pluginKey: [pluginFakerName],
        type: 'function',
      })

      // used for this.options.typed
      const typedName = pluginManager.resolveName({
        name,
        pluginKey: [pluginTsName],
        type: 'type',
      })
      const typedFileName = pluginManager.resolveName({
        name: options.operationName || name,
        pluginKey: [pluginTsName],
        type: 'file',
      })

      // todo replace by getFile
      const typedPath = pluginManager.resolvePath({
        baseName: typedFileName,
        pluginKey: [pluginTsName],
        options: { tag: options.operation?.getTags()[0]?.name },
      })

      const tree = schemaGenerator.parse({ schema, name })
      const imports = getImports(tree)

      return (
        <Oas.Schema key={i} name={name} value={schema} tree={tree}>
          {typedName && typedPath && <File.Import isTypeOnly root={file.path} path={typedPath} name={[typedName]} />}
          {dateParser && <File.Import path={dateParser} name={dateParser} />}

          {mode === 'split' && imports.map((imp, index) => <File.Import key={index} root={file.path} path={imp.path} name={imp.name} />)}
          <Faker
            name={resolvedName}
            typedName={typedName}
            description={description}
            tree={tree}
            regexGenerator={regexGenerator}
            dateParser={dateParser}
            mapper={mapper}
            seed={seed}
          />
        </Oas.Schema>
      )
    }

    return (
      <File baseName={file.baseName} path={file.path} meta={file.meta}>
        {regexGenerator === 'randexp' && <File.Import name={'RandExp'} path={'randexp'} />}
        {operationSchemas.map(mapOperationSchema)}
      </File>
    )
  },
  Schema({ schema, name, tree }) {
    const {
      pluginManager,
      plugin: {
        options: { dateParser, regexGenerator, seed, mapper },
      },
      mode,
    } = useApp<PluginFaker>()
    const { getFile, getImports } = useSchemaManager()

    const file = getFile(name)
    const imports = getImports(tree)

    const resolvedName = pluginManager.resolveName({
      name,
      pluginKey: [pluginFakerName],
      type: 'function',
    })

    // used for this.options.typed
    const typedName = pluginManager.resolveName({
      name,
      pluginKey: [pluginTsName],
      type: 'type',
    })

    const typedFileName = pluginManager.resolveName({
      name: name,
      pluginKey: [pluginTsName],
      type: 'file',
    })

    const typedPath = pluginManager.resolvePath({
      baseName: typedFileName,
      pluginKey: [pluginTsName],
    })

    return (
      <File baseName={file.baseName} path={file.path} meta={file.meta}>
        {regexGenerator === 'randexp' && <File.Import name={'RandExp'} path={'randexp'} />}
        {dateParser && <File.Import path={dateParser} name={dateParser} />}
        {typedName && typedPath && <File.Import isTypeOnly root={file.path} path={typedPath} name={[typedName]} />}
        {mode === 'split' && imports.map((imp, index) => <File.Import key={index} root={file.path} path={imp.path} name={imp.name} />)}
        <Faker
          name={resolvedName}
          typedName={typedName}
          description={schema.description}
          tree={tree}
          regexGenerator={regexGenerator}
          dateParser={dateParser}
          mapper={mapper}
          seed={seed}
        />
      </File>
    )
  },
})
