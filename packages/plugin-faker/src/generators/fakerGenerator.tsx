import { type OperationSchema as OperationSchemaType, SchemaGenerator, createReactGenerator, schemaKeywords } from '@kubb/plugin-oas'
import { Oas } from '@kubb/plugin-oas/components'
import { useOas, useOperationManager, useSchemaManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, useApp } from '@kubb/react'
import { Faker } from '../components'
import type { PluginFaker } from '../types'

export const fakerGenerator = createReactGenerator<PluginFaker>({
  name: 'faker',
  Operation({ operation, options }) {
    const { dateParser, regexGenerator, seed, mapper } = options

    const { plugin, pluginManager, mode } = useApp<PluginFaker>()
    const oas = useOas()
    const { getSchemas, getFile, getGroup } = useOperationManager()
    const schemaManager = useSchemaManager()

    const file = getFile(operation)
    const schemas = getSchemas(operation)
    const schemaGenerator = new SchemaGenerator(options, {
      oas,
      plugin,
      pluginManager,
      mode,
      override: options.override,
    })

    const operationSchemas = [schemas.pathParams, schemas.queryParams, schemas.headerParams, schemas.statusCodes, schemas.request, schemas.response]
      .flat()
      .filter(Boolean)

    const mapOperationSchema = ({ name, schema: schemaObject, description, ...options }: OperationSchemaType, i: number) => {
      const tree = schemaGenerator.parse({ schemaObject, name })
      const imports = schemaManager.getImports(tree)
      const group = options.operation ? getGroup(options.operation) : undefined

      const faker = {
        name: schemaManager.getName(name, { type: 'function' }),
        file: schemaManager.getFile(name),
      }

      const type = {
        name: schemaManager.getName(name, { type: 'type', pluginKey: [pluginTsName] }),
        file: schemaManager.getFile(options.operationName || name, { pluginKey: [pluginTsName], group }),
      }

      const canOverride = tree.some(
        ({ keyword }) =>
          keyword === schemaKeywords.array ||
          keyword === schemaKeywords.and ||
          keyword === schemaKeywords.object ||
          keyword === schemaKeywords.union ||
          keyword === schemaKeywords.tuple,
      )

      return (
        <Oas.Schema key={i} name={name} schemaObject={schemaObject} tree={tree}>
          {canOverride && <File.Import isTypeOnly root={file.path} path={type.file.path} name={[type.name]} />}
          {imports.map((imp, index) => (
            <File.Import key={index} root={file.path} path={imp.path} name={imp.name} />
          ))}
          <Faker
            name={faker.name}
            typeName={type.name}
            description={description}
            tree={tree}
            regexGenerator={regexGenerator}
            dateParser={dateParser}
            mapper={mapper}
            seed={seed}
            canOverride={canOverride}
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
        <File.Import name={['faker']} path="@faker-js/faker" />
        {regexGenerator === 'randexp' && <File.Import name={'RandExp'} path={'randexp'} />}
        {dateParser !== 'faker' && <File.Import path={dateParser} name={dateParser} />}
        {operationSchemas.map(mapOperationSchema)}
      </File>
    )
  },
  Schema({ schema, options }) {
    const { dateParser, regexGenerator, seed, mapper } = options

    const { getName, getFile, getImports } = useSchemaManager()
    const {
      pluginManager,
      plugin: {
        options: { output },
      },
    } = useApp<PluginFaker>()
    const oas = useOas()
    const imports = getImports(schema.tree)

    const faker = {
      name: getName(schema.name, { type: 'function' }),
      file: getFile(schema.name),
    }

    const type = {
      name: getName(schema.name, { type: 'type', pluginKey: [pluginTsName] }),
      file: getFile(schema.name, { pluginKey: [pluginTsName] }),
    }

    const canOverride = schema.tree.some(
      ({ keyword }) =>
        keyword === schemaKeywords.array ||
        keyword === schemaKeywords.and ||
        keyword === schemaKeywords.object ||
        keyword === schemaKeywords.union ||
        keyword === schemaKeywords.tuple,
    )

    return (
      <File
        baseName={faker.file.baseName}
        path={faker.file.path}
        meta={faker.file.meta}
        banner={getBanner({ oas, output, config: pluginManager.config })}
        footer={getFooter({ oas, output })}
      >
        <File.Import name={['faker']} path="@faker-js/faker" />
        {regexGenerator === 'randexp' && <File.Import name={'RandExp'} path={'randexp'} />}
        {dateParser !== 'faker' && <File.Import path={dateParser} name={dateParser} />}
        <File.Import isTypeOnly root={faker.file.path} path={type.file.path} name={[type.name]} />
        {imports.map((imp, index) => (
          <File.Import key={index} root={faker.file.path} path={imp.path} name={imp.name} />
        ))}

        <Faker
          name={faker.name}
          typeName={type.name}
          description={schema.value.description}
          tree={schema.tree}
          regexGenerator={regexGenerator}
          dateParser={dateParser}
          mapper={mapper}
          seed={seed}
          canOverride={canOverride}
        />
      </File>
    )
  },
})
