/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */

export type KubbQueryFactory<
  TData = unknown,
  TError = unknown,
  TRequest = unknown,
  TPathParams = unknown,
  TQueryParams = unknown,
  TResponse = TData,
  TOptions extends { dataReturnType: 'data' | 'full'; type: 'query' | 'mutation' } = { dataReturnType: 'data'; type: 'query' },
> = {
  data: TData
  error: TError
  request: TRequest
  pathParams: TPathParams
  queryParams: TQueryParams
  // generated types, client will be already in the import
  // @ts-ignore
  response: TOptions extends { dataReturnType: 'full' } ? Awaited<ReturnType<typeof client<TData, TError, TRequest>>> : TResponse
  client: {
    // generated types, client will be already in the import
    // @ts-ignore
    paramaters: Partial<Parameters<typeof client<TData, TError, TRequest>>[0]>

    // generated types, client will be already in the import
    // @ts-ignore
    return: Awaited<ReturnType<typeof client<TData, TError, TRequest>>>
  }
} & (TOptions extends { type: 'mutation' } ? { _type: 'mutation' } : { _type: 'query' })
/**
 * examples/advanced/src/gen/clients/hooks/petController/useFindPetsByStatus.ts
 * @example
 * type FindPetsByStatus = KubbQueryFactory<FindPetsByStatusQueryResponse,FindPetsByStatus400, never, FindPetsByStatusQueryParams,FindPetsByStatusQueryParams,FindPetsByStatusQueryResponse,{dataReturnType: "data"}>

    ^?
*/
