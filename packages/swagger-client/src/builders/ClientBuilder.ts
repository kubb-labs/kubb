/* eslint- @typescript-eslint/explicit-module-boundary-types */
import { createJSDocBlockText, combineCodes } from '@kubb/core'
import { OasBuilder, getComments } from '@kubb/swagger'

import { URLPath } from '@kubb/core'
import type { Operation, OperationSchemas } from '@kubb/swagger'
import { getParams } from '@kubb/swagger'

type Config = {
  operation: Operation
  schemas: OperationSchemas
  name: string
}

type ClientResult = { code: string; name: string }

export class ClientBuilder extends OasBuilder<Config> {
  private get client(): ClientResult {
    const { name, operation, schemas } = this.config
    const codes: string[] = []

    const comments = getComments(operation)
    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })
    const method = operation.method

    const generics = [`TData = ${schemas.response.name}`, schemas.request?.name ? `TVariables = ${schemas.request?.name}` : undefined].filter(Boolean)
    const clientGenerics = ['TData', schemas.request?.name ? 'TVariables' : undefined].filter(Boolean)
    const options = [
      pathParamsTyped,
      schemas.request?.name ? 'data: TVariables' : undefined,
      schemas.queryParams?.name ? `params${!schemas.queryParams.schema.required?.length ? '?' : ''}: ${schemas.queryParams.name}` : undefined,
      'options: Partial<Parameters<typeof client>[0]> = {}',
    ].filter(Boolean)

    codes.push(createJSDocBlockText({ comments }))
    codes.push(`
export function ${name} <${generics.join(', ')}>(${options.join(', ')}): Promise<TData> {
  return client<${clientGenerics.join(', ')}>({
    method: "${method}",
    url: ${new URLPath(operation.path).template},
    ${schemas.queryParams?.name ? 'params,' : ''}
    ${schemas.request?.name ? 'data,' : ''}
    ...options
  });
};
`)
    return { code: combineCodes(codes), name }
  }

  configure(config: Config): this {
    this.config = config

    return this
  }

  print(): string {
    return this.client.code
  }
}
