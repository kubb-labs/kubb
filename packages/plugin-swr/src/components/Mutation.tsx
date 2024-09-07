// import transformers from '@kubb/core/transformers'
// import { FunctionParams, URLPath } from '@kubb/core/utils'
// import { useOperation, useOperationManager } from '@kubb/plugin-oas/hooks'
// import { getASTParams, getComments } from '@kubb/plugin-oas/utils'
// import { pluginTsName } from '@kubb/plugin-ts'
// import { File, Function, useApp } from '@kubb/react'
//
// import { SchemaType } from './SchemaType.tsx'
//
// import type { HttpMethod } from '@kubb/oas'
// import type { ReactNode } from 'react'
// import type { FileMeta, PluginSwr } from '../types.ts'
//
// type TemplateProps = {
//   /**
//    * Name of the function
//    */
//   name: string
//   /**
//    * Parameters/options/props that need to be used
//    */
//   params: string
//   /**
//    * Generics that needs to be added for TypeScript
//    */
//   generics?: string
//   /**
//    * ReturnType(see async for adding Promise type)
//    */
//   returnType?: string
//   /**
//    * Options for JSdocs
//    */
//   JSDoc?: {
//     comments: string[]
//   }
//   hook: {
//     name: string
//     generics?: string
//   }
//   client: {
//     method: HttpMethod
//     generics: string
//     withQueryParams: boolean
//     withPathParams: boolean
//     withData: boolean
//     withHeaders: boolean
//     path: URLPath
//   }
//   dataReturnType: any
// }
//
// function Template({ name, generics, returnType, params, JSDoc, client, hook, dataReturnType }: TemplateProps): ReactNode {
//   const clientOptions = [
//     `method: "${client.method}"`,
//     'url',
//     client.withQueryParams ? 'params' : undefined,
//     client.withData ? 'data' : undefined,
//     client.withHeaders ? 'headers: { ...headers, ...clientOptions.headers }' : undefined,
//     '...clientOptions',
//   ].filter(Boolean)
//
//   const resolvedClientOptions = `${transformers.createIndent(4)}${clientOptions.join(`,\n${transformers.createIndent(4)}`)}`
//   if (client.withQueryParams) {
//     return (
//       <File.Source name={name} isExportable isIndexable>
//         <Function export name={name} generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
//           {`
//          const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
//
//          const url = ${client.path.template} as const
//          return ${hook.name}<${hook.generics}>(
//           shouldFetch ? [url, params]: null,
//           async (_url${client.withData ? ', { arg: data }' : ''}) => {
//             const res = await client<${client.generics}>({
//               ${resolvedClientOptions}
//             })
//
//             return ${dataReturnType === 'data' ? 'res.data' : 'res'}
//           },
//           mutationOptions
//         )
//       `}
//         </Function>
//       </File.Source>
//     )
//   }
//
//   return (
//     <File.Source name={name} isExportable isIndexable>
//       <Function export name={name} generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
//         {`
//        const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
//
//        const url = ${client.path.template} as const
//        return ${hook.name}<${hook.generics}>(
//         shouldFetch ? url : null,
//         async (_url${client.withData ? ', { arg: data }' : ''}) => {
//           const res = await client<${client.generics}>({
//             ${resolvedClientOptions}
//           })
//
//           return ${dataReturnType === 'data' ? 'res.data' : 'res'}
//         },
//         mutationOptions
//       )
//     `}
//       </Function>
//     </File.Source>
//   )
// }
//
// const defaultTemplates = {
//   default: Template,
// } as const
//
// type Props = {
//   factory: {
//     name: string
//   }
//   /**
//    * This will make it possible to override the default behaviour.
//    */
//   Template?: React.ComponentType<TemplateProps>
// }
//
// export function Mutation({ factory, Template = defaultTemplates.default }: Props): ReactNode {
//   const {
//     plugin: {
//       options: { dataReturnType },
//     },
//   } = useApp<PluginSwr>()
//   const { getSchemas, getName } = useOperationManager()
//   const operation = useOperation()
//
//   const name = getName(operation, { type: 'function' })
//   const schemas = getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' })
//
//   const params = new FunctionParams()
//   const client = {
//     method: operation.method,
//     path: new URLPath(operation.path),
//     generics: [`${factory.name}["data"]`, `${factory.name}["error"]`, schemas.request?.name ? `${factory.name}["request"]` : ''].filter(Boolean).join(', '),
//     withQueryParams: !!schemas.queryParams?.name,
//     withData: !!schemas.request?.name,
//     withPathParams: !!schemas.pathParams?.name,
//     withHeaders: !!schemas.headerParams?.name,
//   }
//
//   const resultGenerics = [`${factory.name}["response"]`, `${factory.name}["error"]`]
//
//   params.add([
//     ...getASTParams(schemas.pathParams, { typed: true }),
//     {
//       name: 'params',
//       type: `${factory.name}['queryParams']`,
//       enabled: client.withQueryParams,
//       required: false,
//     },
//     {
//       name: 'headers',
//       type: `${factory.name}['headerParams']`,
//       enabled: client.withHeaders,
//       required: false,
//     },
//     {
//       name: 'options',
//       required: false,
//       type: `{
//         mutation?: SWRMutationConfiguration<${resultGenerics.join(', ')}>,
//         client?: ${factory.name}['client']['parameters'],
//         shouldFetch?: boolean,
//       }`,
//       default: '{}',
//     },
//   ])
//
//   const hook = {
//     name: 'useSWRMutation',
//     generics: [...resultGenerics, client.withQueryParams ? '[typeof url, typeof params] | null' : 'Key'].join(', '),
//   }
//
//   return (
//     <Template
//       name={name}
//       JSDoc={{ comments: getComments(operation) }}
//       client={client}
//       hook={hook}
//       params={params.toString()}
//       returnType={`SWRMutationResponse<${resultGenerics.join(', ')}>`}
//       dataReturnType={dataReturnType}
//     />
//   )
// }
//
// type FileProps = {
//   /**
//    * This will make it possible to override the default behaviour.
//    */
//   templates?: typeof defaultTemplates
// }
//
// Mutation.File = function ({ templates = defaultTemplates }: FileProps): ReactNode {
//   const {
//     plugin: {
//       options: {
//         extName,
//         client: { importPath },
//       },
//     },
//   } = useApp<PluginSwr>()
//
//   const { getFile, getName } = useOperationManager()
//   const operation = useOperation()
//
//   const file = getFile(operation)
//   const factoryName = getName(operation, { type: 'type' })
//
//   const Template = templates.default
//   const factory = {
//     name: factoryName,
//   }
//
//   return (
//     <File<FileMeta> baseName={file.baseName} path={file.path} meta={file.meta}>
//       <File.Import name={['Key']} path="swr" isTypeOnly />
//       <File.Import name="useSWRMutation" path="swr/mutation" />
//       <File.Import name={['SWRMutationConfiguration', 'SWRMutationResponse']} path="swr/mutation" isTypeOnly />
//       <File.Import name={'client'} path={importPath} />
//
//       <SchemaType factory={factory} />
//       <Mutation Template={Template} factory={factory} />
//     </File>
//   )
// }
//
// Mutation.templates = defaultTemplates
