import { useMode, usePlugin, usePluginManager } from '@kubb/core/hooks'
import { createReactGenerator, type OperationSchema as OperationSchemaType, SchemaGenerator, schemaKeywords } from '@kubb/plugin-oas'
import { Oas } from '@kubb/plugin-oas/components'
import { useOas, useOperationManager, useSchemaManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { pluginTsName } from '@kubb/plugin-ts'
import { File } from '@kubb/react'
import { Zod } from '../components'
import type { PluginZod } from '../types'

export const zodGenerator = createReactGenerator<PluginZod>({
  name: 'zod',
  Operation({ operation, options, instance }) {
    const { coercion: globalCoercion, inferred, typed, mapper, wrapOutput } = options

    const plugin = usePlugin<PluginZod>()
    const mode = useMode()
    const pluginManager = usePluginManager()

    const oas = useOas()
    const { getSchemas, getFile, getGroup } = useOperationManager()
    const schemaManager = useSchemaManager()

    const file = getFile(operation)
    const schemas = getSchemas(operation)
    const schemaGenerator = new SchemaGenerator(options, {
      fabric: instance.context.fabric,
      oas,
      plugin,
      pluginManager,
      mode,
      override: options.override,
    })

    const operationSchemas = [schemas.pathParams, schemas.queryParams, schemas.headerParams, schemas.statusCodes, schemas.request, schemas.response]
      .flat()
      .filter(Boolean)

    const mapOperationSchema = ({ name, schema: schemaObject, description, keysToOmit, ...options }: OperationSchemaType, i: number) => {
      // hack so Params can be optional when needed
      const required = Array.isArray(schemaObject?.required) ? !!schemaObject.required.length : !!schemaObject?.required
      const someDefaults = Object.values(schemaObject.properties || {}).some((property) => Object.hasOwn(property, 'default') && property.default !== undefined)
      const optional = !required && !someDefaults && name.includes('Params')

      const tree = [...schemaGenerator.parse({ schemaObject, name }), optional ? { keyword: schemaKeywords.optional } : undefined].filter(Boolean)
      const imports = schemaManager.getImports(tree)
      const group = options.operation ? getGroup(options.operation) : undefined

      const coercion = name.includes('Params') ? { numbers: true, strings: false, dates: true } : globalCoercion

      const zod = {
        name: schemaManager.getName(name, { type: 'function' }),
        inferTypeName: schemaManager.getName(name, { type: 'type' }),
        file: schemaManager.getFile(name),
      }

      const type = {
        name: schemaManager.getName(name, {
          type: 'type',
          pluginKey: [pluginTsName],
        }),
        file: schemaManager.getFile(options.operationName || name, {
          pluginKey: [pluginTsName],
          group,
        }),
      }

      return (
        <Oas.Schema key={i} name={name} schemaObject={schemaObject} tree={tree}>
          {typed && <File.Import isTypeOnly root={file.path} path={type.file.path} name={[type.name]} />}
          {typed && plugin.options.version === '3' && <File.Import isTypeOnly path={'@kubb/plugin-zod/utils'} name={['ToZod']} />}
          {imports.map((imp) => (
            <File.Import key={[imp.path, imp.name, imp.isTypeOnly].join('-')} root={file.path} path={imp.path} name={imp.name} />
          ))}
          <Zod
            name={zod.name}
            typeName={typed ? type.name : undefined}
            inferTypeName={inferred ? zod.inferTypeName : undefined}
            description={description}
            tree={tree}
            rawSchema={schemaObject}
            mapper={mapper}
            coercion={coercion}
            keysToOmit={keysToOmit}
            wrapOutput={wrapOutput}
            version={plugin.options.version}
            emptySchemaType={plugin.options.emptySchemaType}
          />
        </Oas.Schema>
      )
    }

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={getBanner({ oas, output: plugin.options.output, config: pluginManager.config })}
        footer={getFooter({ oas, output: plugin.options.output })}
      >
        <File.Import name={['z']} path={plugin.options.importPath} />
        {operationSchemas.map(mapOperationSchema)}
      </File>
    )
  },
  Schema({ schema, options }) {
    const { coercion, inferred, typed, mapper, importPath, wrapOutput, version } = options

    const { getName, getFile, getImports } = useSchemaManager()
    const {
      options: { output, emptySchemaType },
    } = usePlugin<PluginZod>()
    const pluginManager = usePluginManager()
    const oas = useOas()

    const imports = getImports(schema.tree)

    const zod = {
      name: getName(schema.name, { type: 'function' }),
      inferTypeName: getName(schema.name, { type: 'type' }),
      file: getFile(schema.name),
    }

    const type = {
      name: getName(schema.name, { type: 'type', pluginKey: [pluginTsName] }),
      file: getFile(schema.name, { pluginKey: [pluginTsName] }),
    }

    return (
      <File
        baseName={zod.file.baseName}
        path={zod.file.path}
        meta={zod.file.meta}
        banner={getBanner({ oas, output, config: pluginManager.config })}
        footer={getFooter({ oas, output })}
      >
        <File.Import name={['z']} path={importPath} />
        {typed && <File.Import isTypeOnly root={zod.file.path} path={type.file.path} name={[type.name]} />}
        {typed && <File.Import isTypeOnly path={options.version === '4' ? '@kubb/plugin-zod/utils/v4' : '@kubb/plugin-zod/utils'} name={['ToZod']} />}
        {imports.map((imp) => (
          <File.Import key={[imp.path, imp.name, imp.isTypeOnly].join('-')} root={zod.file.path} path={imp.path} name={imp.name} />
        ))}

        <Zod
          name={zod.name}
          typeName={typed ? type.name : undefined}
          inferTypeName={inferred ? zod.inferTypeName : undefined}
          description={schema.value.description}
          tree={schema.tree}
          rawSchema={schema.value}
          mapper={mapper}
          coercion={coercion}
          wrapOutput={wrapOutput}
          version={version}
          emptySchemaType={emptySchemaType}
        />
      </File>
    )
  },
})
