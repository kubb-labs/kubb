/* eslint-disable @typescript-eslint/ban-ts-comment */
type KubbQueryFactory<TData, TError, TRequest, TPathParams, TResponse> = {
  data: TData
  error: TError
  request: TRequest
  pathParams: TPathParams
  response: TResponse
  // generated types, client will be already in the import
  // @ts-ignore
  client: Partial<Parameters<typeof client<TData, TError>>[0]>
}
