import path from 'node:path'
import { useMode, usePluginManager } from '@kubb/core/hooks'
import { type OperationSchema as OperationSchemaType, SchemaGenerator, schemaKeywords } from '@kubb/plugin-oas'
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOas, useOperationManager, useSchemaManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { pluginTsName } from '@kubb/plugin-ts'
import { File } from '@kubb/react-fabric'
import { Zod } from '../components'
import type { PluginZod } from '../types'

export const zodGenerator = createReactGenerator<PluginZod>({
  name: 'zod',
  Operation({ config, operation, generator, plugin }) {
    const {
      options,
      options: { coercion: globalCoercion, inferred, typed, mapper, wrapOutput, version, mini },
    } = plugin

    const mode = useMode()
    const pluginManager = usePluginManager()

    const oas = useOas()
    const { getSchemas, getFile, getGroup } = useOperationManager(generator)
    const schemaManager = useSchemaManager()

    const file = getFile(operation)
    const schemas = getSchemas(operation)
    const schemaGenerator = new SchemaGenerator(options, {
      fabric: generator.context.fabric,
      oas,
      plugin,
      pluginManager,
      events: generator.context.events,
      mode,
      override: options.override,
    })

    const operationSchemas = [schemas.pathParams, schemas.queryParams, schemas.headerParams, schemas.statusCodes, schemas.request, schemas.response]
      .flat()
      .filter(Boolean)

    const mapOperationSchema = ({ name, schema: schemaOriginal, description, keysToOmit: keysToOmitOriginal, ...options }: OperationSchemaType) => {
      let schemaObject = schemaOriginal
      let keysToOmit = keysToOmitOriginal

      if ((schemaOriginal.anyOf || schemaOriginal.oneOf) && keysToOmitOriginal && keysToOmitOriginal.length > 0) {
        schemaObject = structuredClone(schemaOriginal)

        // Remove $ref so the schema parser generates inline schema instead of a reference
        delete schemaObject.$ref

        for (const key of keysToOmitOriginal) {
          delete schemaObject.properties?.[key]
        }

        if (Array.isArray(schemaObject.required)) {
          schemaObject.required = schemaObject.required.filter((key) => !keysToOmitOriginal.includes(key))
        }

        keysToOmit = undefined
      }

      const hasProperties = Object.keys(schemaObject || {}).length > 0
      const hasDefaults = Object.values(schemaObject.properties || {}).some((prop) => prop && Object.hasOwn(prop, 'default'))

      const required = Array.isArray(schemaObject?.required) ? schemaObject.required.length > 0 : !!schemaObject?.required
      const optional = !required && !hasDefaults && hasProperties && name.includes('Params')

      if (!optional && Array.isArray(schemaObject.required) && !schemaObject.required.length) {
        schemaObject.required = Object.entries(schemaObject.properties || {})
          .filter(([_key, value]) => value && Object.hasOwn(value, 'default'))
          .map(([key]) => key)
      }

      const tree = [
        ...schemaGenerator.parse({ schema: schemaObject, name, parentName: null }),
        optional ? { keyword: schemaKeywords.optional } : undefined,
      ].filter(Boolean)
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
        <>
          {typed && <File.Import isTypeOnly root={file.path} path={type.file.path} name={[type.name]} />}
          {typed && version === '3' && <File.Import name={['ToZod']} root={file.path} path={path.resolve(config.root, config.output.path, '.kubb/ToZod.ts')} />}
          {imports.map((imp) => (
            <File.Import key={[imp.path, imp.name, imp.isTypeOnly].join('-')} root={file.path} path={imp.path} name={imp.name} />
          ))}
          <Zod
            name={zod.name}
            typeName={typed ? type.name : undefined}
            inferTypeName={inferred ? zod.inferTypeName : undefined}
            description={description}
            tree={tree}
            schema={schemaObject}
            mapper={mapper}
            coercion={coercion}
            keysToOmit={keysToOmit}
            wrapOutput={wrapOutput}
            version={plugin.options.version}
            emptySchemaType={plugin.options.emptySchemaType}
            mini={mini}
          />
        </>
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
  Schema({ config, schema, plugin }) {
    const { getName, getFile, getImports } = useSchemaManager()
    const {
      options: { output, emptySchemaType, coercion, inferred, typed, mapper, importPath, wrapOutput, version, mini },
    } = plugin
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
        {typed && version === '3' && (
          <File.Import name={['ToZod']} root={zod.file.path} path={path.resolve(config.root, config.output.path, '.kubb/ToZod.ts')} />
        )}
        {imports.map((imp) => (
          <File.Import key={[imp.path, imp.name, imp.isTypeOnly].join('-')} root={zod.file.path} path={imp.path} name={imp.name} />
        ))}

        <Zod
          name={zod.name}
          typeName={typed ? type.name : undefined}
          inferTypeName={inferred ? zod.inferTypeName : undefined}
          description={schema.value.description}
          tree={schema.tree}
          schema={schema.value}
          mapper={mapper}
          coercion={coercion}
          wrapOutput={wrapOutput}
          version={version}
          emptySchemaType={emptySchemaType}
          mini={mini}
        />
      </File>
    )
  },
})
