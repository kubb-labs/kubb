import { type OperationSchema as OperationSchemaType, SchemaGenerator, createReactGenerator } from '@kubb/plugin-oas'
import { Oas } from '@kubb/plugin-oas/components'
import { useOas, useOperationManager, useSchemaManager } from '@kubb/plugin-oas/hooks'
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
    const { getSchemas, getFile } = useOperationManager()
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

    const mapOperationSchema = ({ name, schema, description, ...options }: OperationSchemaType, i: number) => {
      const tree = schemaGenerator.parse({ schema, name })
      const imports = schemaManager.getImports(tree)

      const faker = {
        name: schemaManager.getName(name, { type: 'function' }),
        file: schemaManager.getFile(name),
      }

      const type = {
        name: schemaManager.getName(name, { type: 'type', pluginKey: [pluginTsName] }),
        file: schemaManager.getFile(options.operationName || name, { pluginKey: [pluginTsName], tag: options.operation?.getTags()[0]?.name }),
      }

      return (
        <Oas.Schema key={i} name={name} value={schema} tree={tree}>
          <File.Import isTypeOnly root={file.path} path={type.file.path} name={[type.name]} />
          {imports.map((imp, index) => (
            <File.Import key={index} root={file.path} path={imp.path} name={imp.name} />
          ))}
          <Faker
            name={faker.name}
            typedName={type.name}
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
        <File.Import name={['faker']} path="@faker-js/faker" />
        {regexGenerator === 'randexp' && <File.Import name={'RandExp'} path={'randexp'} />}
        {dateParser && <File.Import path={dateParser} name={dateParser} />}
        {operationSchemas.map(mapOperationSchema)}
      </File>
    )
  },
  Schema({ schema, options }) {
    const { dateParser, regexGenerator, seed, mapper } = options

    const { getName, getFile, getImports } = useSchemaManager()
    const imports = getImports(schema.tree)

    const faker = {
      name: getName(schema.name, { type: 'function' }),
      file: getFile(schema.name),
    }

    const type = {
      name: getName(schema.name, { type: 'type', pluginKey: [pluginTsName] }),
      file: getFile(schema.name, { pluginKey: [pluginTsName] }),
    }

    return (
      <File baseName={faker.file.baseName} path={faker.file.path} meta={faker.file.meta}>
        <File.Import name={['faker']} path="@faker-js/faker" />
        {regexGenerator === 'randexp' && <File.Import name={'RandExp'} path={'randexp'} />}
        {dateParser && <File.Import path={dateParser} name={dateParser} />}
        <File.Import isTypeOnly root={faker.file.path} path={type.file.path} name={[type.name]} />
        {imports.map((imp, index) => (
          <File.Import key={index} root={faker.file.path} path={imp.path} name={imp.name} />
        ))}

        <Faker
          name={faker.name}
          typedName={type.name}
          description={schema.value.description}
          tree={schema.tree}
          regexGenerator={regexGenerator}
          dateParser={dateParser}
          mapper={mapper}
          seed={seed}
        />
      </File>
    )
  },
})
