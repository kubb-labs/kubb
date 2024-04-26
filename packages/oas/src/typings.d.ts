declare module 'openapi-format' {
  interface Options {
    verbose?: boolean
    'no-sort'?: boolean
    sort?: boolean
    output?: string
    sortSet?: {
      root?: Array<'openapi' | 'info' | 'servers' | 'paths' | 'components' | 'tags' | 'x-tagGroups' | 'externalDocs'>
      get?: Array<'operationId' | 'summary' | 'description' | 'parameters' | 'requestBody' | 'responses'>
      post?: Array<'operationId' | 'summary' | 'description' | 'parameters' | 'requestBody' | 'responses'>
      put?: Array<'operationId' | 'summary' | 'description' | 'parameters' | 'requestBody' | 'responses'>
      patch?: Array<'operationId' | 'summary' | 'description' | 'parameters' | 'requestBody' | 'responses'>
      delete?: Array<'operationId' | 'summary' | 'description' | 'parameters' | 'requestBody' | 'responses'>
      parameters?: Array<'name' | 'in' | 'description' | 'required' | 'schema'>
      requestBody?: Array<'description' | 'required' | 'content'>
      responses?: Array<'description' | 'headers' | 'content' | 'links'>
      content?: Array<string>
      components?: Array<'parameters' | 'schemas'>
      schema?: Array<'description' | 'type' | 'items' | 'properties' | 'format' | 'example' | 'default'>
      schemas?: Array<'description' | 'type' | 'items' | 'properties' | 'format' | 'example' | 'default'>
      properties?: Array<'description' | 'type' | 'items' | 'format' | 'example' | 'default' | 'enum'>
    }
    filterSet?: {
      methods?: Array<'get' | 'post' | 'put' | 'patch' | 'delete'>
      inverseMethods?: Array<'get' | 'post' | 'put' | 'patch' | 'delete'>
      tags?: Array<string>
      inverseTags?: Array<string>
      operationIds?: Array<string>
      inverseOperationIds?: Array<string>
      operations?: Array<string>
      flags?: Array<string>
      inverseFlags?: Array<string>
      flagValues?: Array<string>
      inverseFlagValues?: Array<string>
      stripFlags?: Array<string>
      responseContent?: Array<string>
      inverseResponseContent?: Array<string>
      unusedComponents?: Array<'requestBodies' | 'schemas' | 'parameters' | 'responses'>
    }
    sortComponentsSet?: {}
    casingSet?: {}
  }
  function parseFile(path: string): Promise<unknown>

  function openapiFilter<TOas>(document: TOas, options: Options): { data: Toas; resultData: { unusedComp: any } }

  function openapiSort<TOas>(document: TOas, options: Options): { data: Toas; resultData: { unusedComp: any } }
  function openapiChangeCase<TOas>(document: TOas, options: Options): { data: Toas; resultData: { unusedComp: any } }

  function stringify<TOas>(document: TOas, options: Options): string
}
