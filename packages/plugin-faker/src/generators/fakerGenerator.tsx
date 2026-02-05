import { useMode, usePluginManager } from '@kubb/core/hooks'
import transformers, { isValidVarName } from '@kubb/core/transformers'
import type { SchemaObject } from '@kubb/oas'
import { type OperationSchema as OperationSchemaType, SchemaGenerator, schemaKeywords } from '@kubb/plugin-oas'
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOas, useOperationManager, useSchemaManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter, getImports } from '@kubb/plugin-oas/utils'
import { pluginTsName } from '@kubb/plugin-ts'
import { File } from '@kubb/react-fabric'
import { Faker } from '../components'
import type { PluginFaker } from '../types'

/**
 * Apply casing transformation to schema properties
 * Only transforms property names, not nested schemas
 */
function applyParamsCasing(schema: SchemaObject, casing: 'camelcase' | undefined): SchemaObject {
  if (!casing || !schema.properties) {
    return schema
  }

  const transformedProperties: Record<string, any> = {}
  const transformedRequired: string[] = []

  // Transform property names
  Object.entries(schema.properties).forEach(([originalName, propertySchema]) => {
    let transformedName = originalName

    if (casing === 'camelcase') {
      transformedName = transformers.camelCase(originalName)
    } else if (!isValidVarName(originalName)) {
      // If not valid variable name, make it valid
      transformedName = transformers.camelCase(originalName)
    }

    transformedProperties[transformedName] = propertySchema
  })

  // Transform required field names
  if (Array.isArray(schema.required)) {
    schema.required.forEach((originalName) => {
      let transformedName = originalName

      if (casing === 'camelcase') {
        transformedName = transformers.camelCase(originalName)
      } else if (!isValidVarName(originalName)) {
        transformedName = transformers.camelCase(originalName)
      }

      transformedRequired.push(transformedName)
    })
  }

  // Return a new schema with transformed properties and required fields
  return {
    ...schema,
    properties: transformedProperties,
    ...(transformedRequired.length > 0 && { required: transformedRequired }),
  } as SchemaObject
}

/**
 * Check if this schema is a parameter schema (pathParams, queryParams, or headerParams)
 * Only these should be transformed, not response/data/body
 */
function isParameterSchema(schemaName: string): boolean {
  const lowerName = schemaName.toLowerCase()
  return lowerName.includes('pathparams') || lowerName.includes('queryparams') || lowerName.includes('headerparams')
}

export const fakerGenerator = createReactGenerator<PluginFaker>({
  name: 'faker',
  Operation({ operation, generator, plugin }) {
    const {
      options,
      options: { dateParser, regexGenerator, seed, mapper },
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
      events: generator.context.events,
      pluginManager,
      mode,
      override: options.override,
    })

    const operationSchemas = [schemas.pathParams, schemas.queryParams, schemas.headerParams, schemas.statusCodes, schemas.request, schemas.response]
      .flat()
      .filter(Boolean)

    const mapOperationSchema = ({ name, schema, description, ...options }: OperationSchemaType) => {
      // Apply paramsCasing transformation if enabled and this is a parameter schema
      const shouldTransform = isParameterSchema(name) && plugin.options.paramsCasing
      const transformedSchema = shouldTransform ? applyParamsCasing(schema, plugin.options.paramsCasing) : schema

      const tree = schemaGenerator.parse({ schema: transformedSchema, name, parentName: null })
      const imports = getImports(tree)
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
        <>
          {canOverride && <File.Import isTypeOnly root={file.path} path={type.file.path} name={[type.name]} />}
          {imports.map((imp) => (
            <File.Import key={[imp.path, imp.name, imp.isTypeOnly].join('-')} root={file.path} path={imp.path} name={imp.name} />
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
        <File.Import name={['faker']} path="@faker-js/faker" />
        {regexGenerator === 'randexp' && <File.Import name={'RandExp'} path={'randexp'} />}
        {dateParser !== 'faker' && <File.Import path={dateParser} name={dateParser} />}
        {operationSchemas.map(mapOperationSchema)}
      </File>
    )
  },
  Schema({ schema, plugin }) {
    const { getName, getFile } = useSchemaManager()
    const {
      options: { output, dateParser, regexGenerator, seed, mapper },
    } = plugin
    const pluginManager = usePluginManager()
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
        keyword === schemaKeywords.tuple ||
        keyword === schemaKeywords.string ||
        keyword === schemaKeywords.integer ||
        keyword === schemaKeywords.number,
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
        {imports.map((imp) => (
          <File.Import key={[imp.path, imp.name, imp.isTypeOnly].join('-')} root={faker.file.path} path={imp.path} name={imp.name} />
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
