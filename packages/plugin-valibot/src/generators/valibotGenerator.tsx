import { useMode, usePluginManager } from '@kubb/core/hooks'
import { type OperationSchema as OperationSchemaType, SchemaGenerator, schemaKeywords } from '@kubb/plugin-oas'
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOas, useOperationManager, useSchemaManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, Fragment } from '@kubb/react-fabric'
import { Valibot } from '../components'
import type { PluginValibot } from '../types'

export const valibotGenerator = createReactGenerator<PluginValibot>({
  name: 'valibot',
  Operation({ operation, generator, plugin }) {
    const {
      options,
      options: { inferred, typed, mapper, dateType },
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
      mode,
      override: options.override,
    })

    const operationSchemas = [schemas.pathParams, schemas.queryParams, schemas.headerParams, schemas.statusCodes, schemas.request, schemas.response]
      .flat()
      .filter(Boolean)

    const mapOperationSchema = ({ name, schema: schemaObject, description, keysToOmit, ...options }: OperationSchemaType) => {
      const hasProperties = Object.keys(schemaObject || {}).length > 0
      const hasDefaults = Object.values(schemaObject.properties || {}).some((prop) => prop && Object.hasOwn(prop, 'default'))

      const required = Array.isArray(schemaObject?.required) ? schemaObject.required.length > 0 : !!schemaObject?.required
      const optional = !required && !hasDefaults && hasProperties && name.includes('Params')

      if (!optional && Array.isArray(schemaObject.required) && !schemaObject.required.length) {
        schemaObject.required = Object.entries(schemaObject.properties || {})
          .filter(([_key, value]) => value && Object.hasOwn(value, 'default'))
          .map(([key]) => key)
      }

      const tree = [...schemaGenerator.parse({ schemaObject, name }), optional ? { keyword: schemaKeywords.optional } : undefined].filter(Boolean)
      const imports = schemaManager.getImports(tree)
      const group = options.operation ? getGroup(options.operation) : undefined

      const valibot = {
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
        <Fragment>
          {typed && <File.Import isTypeOnly root={file.path} path={type.file.path} name={[type.name]} />}
          {imports.map((imp) => (
            <File.Import key={[imp.path, imp.name, imp.isTypeOnly].join('-')} root={file.path} path={imp.path} name={imp.name} />
          ))}
          <Valibot
            name={valibot.name}
            typeName={typed ? type.name : undefined}
            inferTypeName={inferred ? valibot.inferTypeName : undefined}
            tree={tree}
            schema={schemaObject}
            mapper={mapper}
            keysToOmit={keysToOmit}
            emptySchemaType={plugin.options.emptySchemaType}
            dateType={dateType}
          />
        </Fragment>
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
        <File.Import name={'* as v'} path={plugin.options.importPath} />
        {operationSchemas.map(mapOperationSchema)}
      </File>
    )
  },
  Schema({ schema, plugin }) {
    const { getName, getFile, getImports } = useSchemaManager()
    const {
      options: { output, emptySchemaType, inferred, typed, mapper, importPath, dateType },
    } = plugin
    const pluginManager = usePluginManager()
    const oas = useOas()

    const imports = getImports(schema.tree)

    const valibot = {
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
        baseName={valibot.file.baseName}
        path={valibot.file.path}
        meta={valibot.file.meta}
        banner={getBanner({ oas, output, config: pluginManager.config })}
        footer={getFooter({ oas, output })}
      >
        <File.Import name={'* as v'} path={importPath} />
        {typed && <File.Import isTypeOnly root={valibot.file.path} path={type.file.path} name={[type.name]} />}
        {imports.map((imp) => (
          <File.Import key={[imp.path, imp.name, imp.isTypeOnly].join('-')} root={valibot.file.path} path={imp.path} name={imp.name} />
        ))}

        <Valibot
          name={valibot.name}
          typeName={typed ? type.name : undefined}
          inferTypeName={inferred ? valibot.inferTypeName : undefined}
          tree={schema.tree}
          schema={schema.value}
          mapper={mapper}
          emptySchemaType={emptySchemaType}
          dateType={dateType}
        />
      </File>
    )
  },
})
