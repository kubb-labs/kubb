import { camelCase, isValidVarName, URLPath } from '@internals/utils'
import type { Params } from '@kubb/core'
import { FunctionParams } from '@kubb/core'
import { Const, File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'

/**
 * Structural type matching OperationSchema from @kubb/plugin-oas.
 * Avoids importing from @kubb/oas or @kubb/plugin-oas.
 * Uses broad types so that OperationSchemas is assignable without imports.
 */
type LegacyOperationSchema = {
  name?: string
  schema?: Record<string, any>
  statusCode?: string | number
  [key: string]: unknown
}

type LegacyOperationSchemas = {
  pathParams?: LegacyOperationSchema
  queryParams?: LegacyOperationSchema
  headerParams?: LegacyOperationSchema
  request?: LegacyOperationSchema
  response: LegacyOperationSchema & { name: string }
  statusCodes?: Array<LegacyOperationSchema & { name: string }>
  errors?: Array<LegacyOperationSchema & { name: string }>
  [key: string]: unknown
}

type LegacyOperation = {
  path: string
  method: string
  getDescription?(): string | undefined
  getSummary?(): string | undefined
  isDeprecated?(): boolean
  getContentType?(): string
}

function isSchemaRequired(schema?: LegacyOperationSchema['schema']): boolean {
  if (!schema) return false
  return Array.isArray(schema.required) ? !!schema.required.length : !!schema.required
}

function isSchemaOptional(schema?: LegacyOperationSchema['schema']): boolean {
  return !isSchemaRequired(schema)
}

function isAllOptionalDeep(schema?: any): boolean {
  if (!schema) return true
  if (Array.isArray(schema.required) && schema.required.length > 0) return false
  if (schema.allOf) return (schema.allOf as any[]).every(isAllOptionalDeep)
  return true
}

function getSchemaDefaultValue(schema?: LegacyOperationSchema['schema']): string | undefined {
  if (!schema || !isSchemaOptional(schema)) return undefined
  if (schema.type === 'array') return '[]'
  if (schema.anyOf || schema.oneOf) {
    const variants = (schema.anyOf || schema.oneOf) as any[]
    if (!Array.isArray(variants)) return undefined
    if (variants.some(isAllOptionalDeep)) return '{}'
    return undefined
  }
  if (schema.type === 'object' || schema.properties) return '{}'
  return undefined
}

function legacyGetPathParams(operationSchema: LegacyOperationSchema | undefined, options: { typed?: boolean; casing?: 'camelcase' } = {}): Params {
  if (!operationSchema?.schema?.properties || !operationSchema.name) return {}

  const requiredFields = Array.isArray(operationSchema.schema.required) ? operationSchema.schema.required : []

  return Object.entries(operationSchema.schema.properties).reduce((acc, [name]) => {
    if (!name) return acc
    let paramName = name
    if (options.casing === 'camelcase') {
      paramName = camelCase(name)
    } else if (!isValidVarName(name)) {
      paramName = camelCase(name)
    }

    const accessName = options.casing === 'camelcase' ? camelCase(name) : name

    acc[paramName] = {
      default: undefined,
      type: options.typed ? `${operationSchema.name}["${accessName}"]` : undefined,
      optional: !requiredFields.includes(name),
    }
    return acc
  }, {} as Params)
}

function legacyGetParamsMapping(
  operationSchema: LegacyOperationSchema | undefined,
  options: { casing?: 'camelcase' } = {},
): Record<string, string> | undefined {
  if (!operationSchema?.schema?.properties) return undefined

  const allEntries: Array<[string, string]> = []
  let hasTransformation = false

  Object.entries(operationSchema.schema.properties).forEach(([originalName]) => {
    let transformedName = originalName
    if (options.casing === 'camelcase') {
      transformedName = camelCase(originalName)
    } else if (!isValidVarName(originalName)) {
      transformedName = camelCase(originalName)
    }
    allEntries.push([originalName, transformedName])
    if (transformedName !== originalName) hasTransformation = true
  })

  if (options.casing === 'camelcase' && hasTransformation) {
    return Object.fromEntries(allEntries)
  }

  const mapping: Record<string, string> = {}
  allEntries.forEach(([originalName, transformedName]) => {
    if (transformedName !== originalName) mapping[originalName] = transformedName
  })

  return Object.keys(mapping).length > 0 ? mapping : undefined
}

function legacyGetComments(operation: LegacyOperation): string[] {
  return [
    operation.getDescription?.() && `@description ${operation.getDescription!()}`,
    operation.getSummary?.() && `@summary ${operation.getSummary!()}`,
    operation.path && `{@link ${new URLPath(operation.path).URL}}`,
    operation.isDeprecated?.() && '@deprecated',
  ]
    .filter((x): x is string => Boolean(x))
    .flatMap((text) => text.split(/\r?\n/).map((line) => line.trim()))
    .filter((x): x is string => Boolean(x))
}

type Props = {
  name: string
  urlName?: string
  isExportable?: boolean
  isIndexable?: boolean
  isConfigurable?: boolean
  returnType?: string
  baseURL: string | undefined
  dataReturnType: 'data' | 'full'
  paramsCasing?: 'camelcase'
  paramsType: 'object' | 'inline'
  pathParamsType: 'object' | 'inline'
  parser: 'client' | 'zod' | undefined
  typeSchemas: LegacyOperationSchemas
  zodSchemas: LegacyOperationSchemas | undefined
  operation: LegacyOperation
  children?: KubbReactNode
}

type GetParamsProps = {
  paramsCasing?: 'camelcase'
  paramsType: 'object' | 'inline'
  pathParamsType: 'object' | 'inline'
  typeSchemas: LegacyOperationSchemas
  isConfigurable: boolean
}

function getParams({ paramsType, paramsCasing, pathParamsType, typeSchemas, isConfigurable }: GetParamsProps) {
  if (paramsType === 'object') {
    const pathParams = legacyGetPathParams(typeSchemas.pathParams, {
      typed: true,
      casing: paramsCasing,
    })

    const children = {
      ...pathParams,
      data: typeSchemas.request?.name
        ? {
            type: typeSchemas.request?.name,
            optional: isSchemaOptional(typeSchemas.request?.schema),
          }
        : undefined,
      params: typeSchemas.queryParams?.name
        ? {
            type: typeSchemas.queryParams?.name,
            optional: isSchemaOptional(typeSchemas.queryParams?.schema),
          }
        : undefined,
      headers: typeSchemas.headerParams?.name
        ? {
            type: typeSchemas.headerParams?.name,
            optional: isSchemaOptional(typeSchemas.headerParams?.schema),
          }
        : undefined,
    }

    const allChildrenAreOptional = Object.values(children).every((child) => !child || child.optional)

    return FunctionParams.factory({
      data: {
        mode: 'object' as const,
        children,
        default: allChildrenAreOptional ? '{}' : undefined,
      },
      config: isConfigurable
        ? {
            type: typeSchemas.request?.name
              ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: Client }`
              : 'Partial<RequestConfig> & { client?: Client }',
            default: '{}',
          }
        : undefined,
    })
  }

  return FunctionParams.factory({
    pathParams: typeSchemas.pathParams?.name
      ? {
          mode: pathParamsType === 'object' ? ('object' as const) : ('inlineSpread' as const),
          children: legacyGetPathParams(typeSchemas.pathParams, {
            typed: true,
            casing: paramsCasing,
          }),
          default: getSchemaDefaultValue(typeSchemas.pathParams?.schema),
        }
      : undefined,
    data: typeSchemas.request?.name
      ? {
          type: typeSchemas.request?.name,
          optional: isSchemaOptional(typeSchemas.request?.schema),
        }
      : undefined,
    params: typeSchemas.queryParams?.name
      ? {
          type: typeSchemas.queryParams?.name,
          optional: isSchemaOptional(typeSchemas.queryParams?.schema),
        }
      : undefined,
    headers: typeSchemas.headerParams?.name
      ? {
          type: typeSchemas.headerParams?.name,
          optional: isSchemaOptional(typeSchemas.headerParams?.schema),
        }
      : undefined,
    config: isConfigurable
      ? {
          type: typeSchemas.request?.name
            ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: Client }`
            : 'Partial<RequestConfig> & { client?: Client }',
          default: '{}',
        }
      : undefined,
  })
}

export function ClientLegacy({
  name,
  isExportable = true,
  isIndexable = true,
  returnType,
  typeSchemas,
  baseURL,
  dataReturnType,
  parser,
  zodSchemas,
  paramsType,
  paramsCasing,
  pathParamsType,
  operation,
  urlName,
  children,
  isConfigurable = true,
}: Props): KubbReactNode {
  const path = new URLPath(operation.path)
  const contentType = operation.getContentType?.() ?? 'application/json'
  const isFormData = contentType === 'multipart/form-data'

  const pathParamsMapping = paramsCasing && !urlName ? legacyGetParamsMapping(typeSchemas.pathParams, { casing: paramsCasing }) : undefined
  const queryParamsMapping = paramsCasing ? legacyGetParamsMapping(typeSchemas.queryParams, { casing: paramsCasing }) : undefined
  const headerParamsMapping = paramsCasing ? legacyGetParamsMapping(typeSchemas.headerParams, { casing: paramsCasing }) : undefined

  const headers = [
    contentType !== 'application/json' && contentType !== 'multipart/form-data' ? `'Content-Type': '${contentType}'` : undefined,
    typeSchemas.headerParams?.name ? (headerParamsMapping ? '...mappedHeaders' : '...headers') : undefined,
  ].filter(Boolean)

  const TError = `ResponseErrorConfig<${typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error'}>`

  const generics = [typeSchemas.response.name, TError, typeSchemas.request?.name || 'unknown'].filter(Boolean)
  const params = getParams({
    paramsType,
    paramsCasing,
    pathParamsType,
    typeSchemas,
    isConfigurable,
  })
  const urlParams = UrlLegacy.getParams({
    paramsType,
    paramsCasing,
    pathParamsType,
    typeSchemas,
  })

  const clientParams = FunctionParams.factory({
    config: {
      mode: 'object' as const,
      children: {
        method: {
          value: JSON.stringify(operation.method.toUpperCase()),
        },
        url: {
          value: urlName ? `${urlName}(${urlParams.toCall()}).url.toString()` : path.template,
        },
        baseURL:
          baseURL && !urlName
            ? {
                value: `\`${baseURL}\``,
              }
            : undefined,
        params: typeSchemas.queryParams?.name ? (queryParamsMapping ? { value: 'mappedParams' } : {}) : undefined,
        data: typeSchemas.request?.name
          ? {
              value: isFormData ? 'formData as FormData' : 'requestData',
            }
          : undefined,
        requestConfig: isConfigurable
          ? {
              mode: 'inlineSpread' as const,
            }
          : undefined,
        headers: headers.length
          ? {
              value: isConfigurable ? `{ ${headers.join(', ')}, ...requestConfig.headers }` : `{ ${headers.join(', ')} }`,
            }
          : undefined,
      },
    },
  })

  const childrenElement = children ? (
    children
  ) : (
    <>
      {dataReturnType === 'full' && parser === 'zod' && zodSchemas && `return {...res, data: ${zodSchemas.response.name}.parse(res.data)}`}
      {dataReturnType === 'data' && parser === 'zod' && zodSchemas && `return ${zodSchemas.response.name}.parse(res.data)`}
      {dataReturnType === 'full' && parser === 'client' && 'return res'}
      {dataReturnType === 'data' && parser === 'client' && 'return res.data'}
    </>
  )

  return (
    <>
      <br />

      <File.Source name={name} isExportable={isExportable} isIndexable={isIndexable}>
        <Function
          name={name}
          async
          export={isExportable}
          params={params.toConstructor()}
          JSDoc={{
            comments: legacyGetComments(operation),
          }}
          returnType={returnType}
        >
          {isConfigurable ? 'const { client: request = fetch, ...requestConfig } = config' : ''}
          <br />
          <br />
          {pathParamsMapping &&
            Object.entries(pathParamsMapping)
              .filter(([originalName, camelCaseName]) => originalName !== camelCaseName && isValidVarName(originalName))
              .map(([originalName, camelCaseName]) => `const ${originalName} = ${camelCaseName}`)
              .join('\n')}
          {pathParamsMapping && (
            <>
              <br />
              <br />
            </>
          )}
          {queryParamsMapping && typeSchemas.queryParams?.name && (
            <>
              {`const mappedParams = params ? { ${Object.entries(queryParamsMapping)
                .map(([originalName, camelCaseName]) => `"${originalName}": params.${camelCaseName}`)
                .join(', ')} } : undefined`}
              <br />
              <br />
            </>
          )}
          {headerParamsMapping && typeSchemas.headerParams?.name && (
            <>
              {`const mappedHeaders = headers ? { ${Object.entries(headerParamsMapping)
                .map(([originalName, camelCaseName]) => `"${originalName}": headers.${camelCaseName}`)
                .join(', ')} } : undefined`}
              <br />
              <br />
            </>
          )}
          {parser === 'zod' && zodSchemas?.request?.name
            ? `const requestData = ${zodSchemas.request.name}.parse(data)`
            : typeSchemas?.request?.name && 'const requestData = data'}
          <br />
          {isFormData && typeSchemas?.request?.name && 'const formData = buildFormData(requestData)'}
          <br />
          {isConfigurable
            ? `const res = await request<${generics.join(', ')}>(${clientParams.toCall()})`
            : `const res = await fetch<${generics.join(', ')}>(${clientParams.toCall()})`}
          <br />
          {childrenElement}
        </Function>
      </File.Source>
    </>
  )
}

ClientLegacy.getParams = getParams

// --- UrlLegacy ---

type UrlProps = {
  name: string
  isExportable?: boolean
  isIndexable?: boolean
  baseURL: string | undefined
  paramsCasing?: 'camelcase'
  paramsType: 'object' | 'inline'
  pathParamsType: 'object' | 'inline'
  typeSchemas: LegacyOperationSchemas
  operation: LegacyOperation
}

type UrlGetParamsProps = {
  paramsCasing?: 'camelcase'
  paramsType: 'object' | 'inline'
  pathParamsType: 'object' | 'inline'
  typeSchemas: LegacyOperationSchemas
}

function getUrlParams({ paramsType, paramsCasing, pathParamsType, typeSchemas }: UrlGetParamsProps) {
  if (paramsType === 'object') {
    const pathParams = legacyGetPathParams(typeSchemas.pathParams, {
      typed: true,
      casing: paramsCasing,
    })

    return FunctionParams.factory({
      data: {
        mode: 'object' as const,
        children: {
          ...pathParams,
        },
      },
    })
  }

  return FunctionParams.factory({
    pathParams: typeSchemas.pathParams?.name
      ? {
          mode: pathParamsType === 'object' ? ('object' as const) : ('inlineSpread' as const),
          children: legacyGetPathParams(typeSchemas.pathParams, {
            typed: true,
            casing: paramsCasing,
          }),
          default: getSchemaDefaultValue(typeSchemas.pathParams?.schema),
        }
      : undefined,
  })
}

export function UrlLegacy({
  name,
  isExportable = true,
  isIndexable = true,
  typeSchemas,
  baseURL,
  paramsType,
  paramsCasing,
  pathParamsType,
  operation,
}: UrlProps): KubbReactNode {
  const path = new URLPath(operation.path)
  const params = getUrlParams({
    paramsType,
    paramsCasing,
    pathParamsType,
    typeSchemas,
  })

  const pathParamsMapping = paramsCasing ? legacyGetParamsMapping(typeSchemas.pathParams, { casing: paramsCasing }) : undefined

  return (
    <File.Source name={name} isExportable={isExportable} isIndexable={isIndexable}>
      <Function name={name} export={isExportable} params={params.toConstructor()}>
        {pathParamsMapping &&
          Object.entries(pathParamsMapping)
            .filter(([originalName, camelCaseName]) => originalName !== camelCaseName && isValidVarName(originalName))
            .map(([originalName, camelCaseName]) => `const ${originalName} = ${camelCaseName}`)
            .join('\n')}
        {pathParamsMapping && <br />}
        <Const name={'res'}>{`{ method: '${operation.method.toUpperCase()}', url: ${path.toTemplateString({ prefix: baseURL })} as const }`}</Const>
        <br />
        return res
      </Function>
    </File.Source>
  )
}

UrlLegacy.getParams = getUrlParams
