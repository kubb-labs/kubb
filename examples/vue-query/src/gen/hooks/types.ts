import type client from '@kubb/swagger-client/client'

export type KubbQueryFactory<
  TData = unknown,
  TError = unknown,
  TRequest = unknown,
  TPathParams = unknown,
  TQueryParams = unknown,
  TResponse = TData,
  TOptions extends {
    dataReturnType: 'data' | 'full'
    type: 'query' | 'mutation'
  } = {
    dataReturnType: 'data'
    type: 'query'
  },
> =
  & {
    data: TData
    error: TError
    request: TRequest
    pathParams: TPathParams
    queryParams: TQueryParams
    response: TOptions extends {
      dataReturnType: 'full'
    } ? Awaited<ReturnType<typeof client<TData, TError, TRequest>>>
      : TResponse
    client: {
      paramaters: Partial<Parameters<typeof client<TData, TError, TRequest>>[0]>
      return: Awaited<ReturnType<typeof client<TData, TError, TRequest>>>
    }
  }
  & (TOptions extends {
    type: 'mutation'
  } ? {
      _type: 'mutation'
    }
    : {
      _type: 'query'
    })
