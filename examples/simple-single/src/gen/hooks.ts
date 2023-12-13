import client from '@kubb/swagger-client/client'
import { useMutation, useQuery } from '@tanstack/react-query'
import type {
  UpdatePetMutationRequest,
  UpdatePetMutationResponse,
  UpdatePet400,
  UpdatePet404,
  UpdatePet405,
  AddPetMutationRequest,
  AddPetMutationResponse,
  AddPet405,
  FindPetsByStatusQueryResponse,
  FindPetsByStatusQueryParams,
  FindPetsByStatus400,
  FindPetsByTagsQueryResponse,
  FindPetsByTagsQueryParams,
  FindPetsByTags400,
  GetPetByIdQueryResponse,
  GetPetByIdPathParams,
  GetPetById400,
  GetPetById404,
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithForm405,
  DeletePetMutationResponse,
  DeletePetPathParams,
  DeletePetHeaderParams,
  DeletePet400,
  UploadFileMutationRequest,
  UploadFileMutationResponse,
  UploadFilePathParams,
  UploadFileQueryParams,
  GetInventoryQueryResponse,
  PlaceOrderMutationRequest,
  PlaceOrderMutationResponse,
  PlaceOrder405,
  PlaceOrderPatchMutationRequest,
  PlaceOrderPatchMutationResponse,
  PlaceOrderPatch405,
  GetOrderByIdQueryResponse,
  GetOrderByIdPathParams,
  GetOrderById400,
  GetOrderById404,
  DeleteOrderMutationResponse,
  DeleteOrderPathParams,
  DeleteOrder400,
  DeleteOrder404,
  CreateUserMutationRequest,
  CreateUserMutationResponse,
  CreateUserError,
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
  CreateUsersWithListInputError,
  LoginUserQueryResponse,
  LoginUserQueryParams,
  LoginUser400,
  LogoutUserQueryResponse,
  LogoutUserError,
  GetUserByNameQueryResponse,
  GetUserByNamePathParams,
  GetUserByName400,
  GetUserByName404,
  UpdateUserMutationRequest,
  UpdateUserMutationResponse,
  UpdateUserPathParams,
  UpdateUserError,
  DeleteUserMutationResponse,
  DeleteUserPathParams,
  DeleteUser400,
  DeleteUser404,
} from './models'
import type { UseMutationOptions, UseMutationResult, UseBaseQueryOptions, UseQueryResult, QueryKey, WithRequired } from '@tanstack/react-query'

type UpdatePetClient = typeof client<UpdatePetMutationResponse, UpdatePet400 | UpdatePet404 | UpdatePet405, UpdatePetMutationRequest>
type UpdatePet = {
  data: UpdatePetMutationResponse
  error: UpdatePet400 | UpdatePet404 | UpdatePet405
  request: UpdatePetMutationRequest
  pathParams: never
  queryParams: never
  headerParams: never
  response: UpdatePetMutationResponse
  client: {
    paramaters: Partial<Parameters<UpdatePetClient>[0]>
    return: Awaited<ReturnType<UpdatePetClient>>
  }
}
/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet */
export function useUpdatePet(options: {
  mutation?: UseMutationOptions<UpdatePet['response'], UpdatePet['error'], UpdatePet['request']>
  client?: UpdatePet['client']['paramaters']
} = {}): UseMutationResult<UpdatePet['response'], UpdatePet['error'], UpdatePet['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<UpdatePet['response'], UpdatePet['error'], UpdatePet['request']>({
    mutationFn: async (data) => {
      const res = await client<UpdatePet['data'], UpdatePet['error'], UpdatePet['request']>({
        method: 'put',
        url: `/pet`,
        data,
        ...clientOptions,
      })
      return res.data
    },
    ...mutationOptions,
  })
}

type AddPetClient = typeof client<AddPetMutationResponse, AddPet405, AddPetMutationRequest>
type AddPet = {
  data: AddPetMutationResponse
  error: AddPet405
  request: AddPetMutationRequest
  pathParams: never
  queryParams: never
  headerParams: never
  response: AddPetMutationResponse
  client: {
    paramaters: Partial<Parameters<AddPetClient>[0]>
    return: Awaited<ReturnType<AddPetClient>>
  }
}
/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet */
export function useAddPet(options: {
  mutation?: UseMutationOptions<AddPet['response'], AddPet['error'], AddPet['request']>
  client?: AddPet['client']['paramaters']
} = {}): UseMutationResult<AddPet['response'], AddPet['error'], AddPet['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<AddPet['response'], AddPet['error'], AddPet['request']>({
    mutationFn: async (data) => {
      const res = await client<AddPet['data'], AddPet['error'], AddPet['request']>({
        method: 'post',
        url: `/pet`,
        data,
        ...clientOptions,
      })
      return res.data
    },
    ...mutationOptions,
  })
}

type FindPetsByStatusClient = typeof client<FindPetsByStatusQueryResponse, FindPetsByStatus400, never>
type FindPetsByStatus = {
  data: FindPetsByStatusQueryResponse
  error: FindPetsByStatus400
  request: never
  pathParams: never
  queryParams: FindPetsByStatusQueryParams
  headerParams: never
  response: FindPetsByStatusQueryResponse
  client: {
    paramaters: Partial<Parameters<FindPetsByStatusClient>[0]>
    return: Awaited<ReturnType<FindPetsByStatusClient>>
  }
}
export const findPetsByStatusQueryKey = (params?: FindPetsByStatus['queryParams']) => [{ url: '/pet/findByStatus' }, ...(params ? [params] : [])] as const
export type FindPetsByStatusQueryKey = ReturnType<typeof findPetsByStatusQueryKey>
export function findPetsByStatusQueryOptions<
  TQueryFnData extends FindPetsByStatus['data'] = FindPetsByStatus['data'],
  TError = FindPetsByStatus['error'],
  TData = FindPetsByStatus['response'],
  TQueryData = FindPetsByStatus['response'],
>(
  params?: FindPetsByStatus['queryParams'],
  options: FindPetsByStatus['client']['paramaters'] = {},
): WithRequired<UseBaseQueryOptions<FindPetsByStatus['response'], TError, TData, TQueryData>, 'queryKey'> {
  const queryKey = findPetsByStatusQueryKey(params)
  return {
    queryKey,
    queryFn: async () => {
      const res = await client<TQueryFnData, TError>({
        method: 'get',
        url: `/pet/findByStatus`,
        params,
        ...options,
      })
      return res.data
    },
  }
}
/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus */
export function useFindPetsByStatus<
  TQueryFnData extends FindPetsByStatus['data'] = FindPetsByStatus['data'],
  TError = FindPetsByStatus['error'],
  TData = FindPetsByStatus['response'],
  TQueryData = FindPetsByStatus['response'],
  TQueryKey extends QueryKey = FindPetsByStatusQueryKey,
>(params?: FindPetsByStatus['queryParams'], options: {
  query?: UseBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  client?: FindPetsByStatus['client']['paramaters']
} = {}): UseQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByStatusQueryKey(params)
  const query = useQuery<TQueryFnData, TError, TData, any>({
    ...findPetsByStatusQueryOptions<TQueryFnData, TError, TData, TQueryData>(params, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}

type FindPetsByTagsClient = typeof client<FindPetsByTagsQueryResponse, FindPetsByTags400, never>
type FindPetsByTags = {
  data: FindPetsByTagsQueryResponse
  error: FindPetsByTags400
  request: never
  pathParams: never
  queryParams: FindPetsByTagsQueryParams
  headerParams: never
  response: FindPetsByTagsQueryResponse
  client: {
    paramaters: Partial<Parameters<FindPetsByTagsClient>[0]>
    return: Awaited<ReturnType<FindPetsByTagsClient>>
  }
}
export const findPetsByTagsQueryKey = (params?: FindPetsByTags['queryParams']) => [{ url: '/pet/findByTags' }, ...(params ? [params] : [])] as const
export type FindPetsByTagsQueryKey = ReturnType<typeof findPetsByTagsQueryKey>
export function findPetsByTagsQueryOptions<
  TQueryFnData extends FindPetsByTags['data'] = FindPetsByTags['data'],
  TError = FindPetsByTags['error'],
  TData = FindPetsByTags['response'],
  TQueryData = FindPetsByTags['response'],
>(
  params?: FindPetsByTags['queryParams'],
  options: FindPetsByTags['client']['paramaters'] = {},
): WithRequired<UseBaseQueryOptions<FindPetsByTags['response'], TError, TData, TQueryData>, 'queryKey'> {
  const queryKey = findPetsByTagsQueryKey(params)
  return {
    queryKey,
    queryFn: async () => {
      const res = await client<TQueryFnData, TError>({
        method: 'get',
        url: `/pet/findByTags`,
        params,
        ...options,
      })
      return res.data
    },
  }
}
/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags */
export function useFindPetsByTags<
  TQueryFnData extends FindPetsByTags['data'] = FindPetsByTags['data'],
  TError = FindPetsByTags['error'],
  TData = FindPetsByTags['response'],
  TQueryData = FindPetsByTags['response'],
  TQueryKey extends QueryKey = FindPetsByTagsQueryKey,
>(params?: FindPetsByTags['queryParams'], options: {
  query?: UseBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  client?: FindPetsByTags['client']['paramaters']
} = {}): UseQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsQueryKey(params)
  const query = useQuery<TQueryFnData, TError, TData, any>({
    ...findPetsByTagsQueryOptions<TQueryFnData, TError, TData, TQueryData>(params, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}

type GetPetByIdClient = typeof client<GetPetByIdQueryResponse, GetPetById400 | GetPetById404, never>
type GetPetById = {
  data: GetPetByIdQueryResponse
  error: GetPetById400 | GetPetById404
  request: never
  pathParams: GetPetByIdPathParams
  queryParams: never
  headerParams: never
  response: GetPetByIdQueryResponse
  client: {
    paramaters: Partial<Parameters<GetPetByIdClient>[0]>
    return: Awaited<ReturnType<GetPetByIdClient>>
  }
}
export const getPetByIdQueryKey = (petId: GetPetByIdPathParams['petId']) => [{ url: '/pet/:petId', params: { petId: petId } }] as const
export type GetPetByIdQueryKey = ReturnType<typeof getPetByIdQueryKey>
export function getPetByIdQueryOptions<
  TQueryFnData extends GetPetById['data'] = GetPetById['data'],
  TError = GetPetById['error'],
  TData = GetPetById['response'],
  TQueryData = GetPetById['response'],
>(
  petId: GetPetByIdPathParams['petId'],
  options: GetPetById['client']['paramaters'] = {},
): WithRequired<UseBaseQueryOptions<GetPetById['response'], TError, TData, TQueryData>, 'queryKey'> {
  const queryKey = getPetByIdQueryKey(petId)
  return {
    queryKey,
    queryFn: async () => {
      const res = await client<TQueryFnData, TError>({
        method: 'get',
        url: `/pet/${petId}`,
        ...options,
      })
      return res.data
    },
  }
}
/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId */
export function useGetPetById<
  TQueryFnData extends GetPetById['data'] = GetPetById['data'],
  TError = GetPetById['error'],
  TData = GetPetById['response'],
  TQueryData = GetPetById['response'],
  TQueryKey extends QueryKey = GetPetByIdQueryKey,
>(petId: GetPetByIdPathParams['petId'], options: {
  query?: UseBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  client?: GetPetById['client']['paramaters']
} = {}): UseQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getPetByIdQueryKey(petId)
  const query = useQuery<TQueryFnData, TError, TData, any>({
    ...getPetByIdQueryOptions<TQueryFnData, TError, TData, TQueryData>(petId, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}

type UpdatePetWithFormClient = typeof client<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, never>
type UpdatePetWithForm = {
  data: UpdatePetWithFormMutationResponse
  error: UpdatePetWithForm405
  request: never
  pathParams: UpdatePetWithFormPathParams
  queryParams: UpdatePetWithFormQueryParams
  headerParams: never
  response: UpdatePetWithFormMutationResponse
  client: {
    paramaters: Partial<Parameters<UpdatePetWithFormClient>[0]>
    return: Awaited<ReturnType<UpdatePetWithFormClient>>
  }
}
/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId */
export function useUpdatePetWithForm(petId: UpdatePetWithFormPathParams['petId'], params?: UpdatePetWithForm['queryParams'], options: {
  mutation?: UseMutationOptions<UpdatePetWithForm['response'], UpdatePetWithForm['error'], void>
  client?: UpdatePetWithForm['client']['paramaters']
} = {}): UseMutationResult<UpdatePetWithForm['response'], UpdatePetWithForm['error'], void> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<UpdatePetWithForm['response'], UpdatePetWithForm['error'], void>({
    mutationFn: async () => {
      const res = await client<UpdatePetWithForm['data'], UpdatePetWithForm['error'], void>({
        method: 'post',
        url: `/pet/${petId}`,
        params,
        ...clientOptions,
      })
      return res.data
    },
    ...mutationOptions,
  })
}

type DeletePetClient = typeof client<DeletePetMutationResponse, DeletePet400, never>
type DeletePet = {
  data: DeletePetMutationResponse
  error: DeletePet400
  request: never
  pathParams: DeletePetPathParams
  queryParams: never
  headerParams: DeletePetHeaderParams
  response: DeletePetMutationResponse
  client: {
    paramaters: Partial<Parameters<DeletePetClient>[0]>
    return: Awaited<ReturnType<DeletePetClient>>
  }
}
/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/:petId */
export function useDeletePet(petId: DeletePetPathParams['petId'], headers?: DeletePet['headerParams'], options: {
  mutation?: UseMutationOptions<DeletePet['response'], DeletePet['error'], void>
  client?: DeletePet['client']['paramaters']
} = {}): UseMutationResult<DeletePet['response'], DeletePet['error'], void> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<DeletePet['response'], DeletePet['error'], void>({
    mutationFn: async () => {
      const res = await client<DeletePet['data'], DeletePet['error'], void>({
        method: 'delete',
        url: `/pet/${petId}`,
        headers: { ...headers, ...clientOptions.headers },
        ...clientOptions,
      })
      return res.data
    },
    ...mutationOptions,
  })
}

type UploadFileClient = typeof client<UploadFileMutationResponse, never, UploadFileMutationRequest>
type UploadFile = {
  data: UploadFileMutationResponse
  error: never
  request: UploadFileMutationRequest
  pathParams: UploadFilePathParams
  queryParams: UploadFileQueryParams
  headerParams: never
  response: UploadFileMutationResponse
  client: {
    paramaters: Partial<Parameters<UploadFileClient>[0]>
    return: Awaited<ReturnType<UploadFileClient>>
  }
}
/**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage */
export function useUploadFile(petId: UploadFilePathParams['petId'], params?: UploadFile['queryParams'], options: {
  mutation?: UseMutationOptions<UploadFile['response'], UploadFile['error'], UploadFile['request']>
  client?: UploadFile['client']['paramaters']
} = {}): UseMutationResult<UploadFile['response'], UploadFile['error'], UploadFile['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<UploadFile['response'], UploadFile['error'], UploadFile['request']>({
    mutationFn: async (data) => {
      const res = await client<UploadFile['data'], UploadFile['error'], UploadFile['request']>({
        method: 'post',
        url: `/pet/${petId}/uploadImage`,
        params,
        data,
        ...clientOptions,
      })
      return res.data
    },
    ...mutationOptions,
  })
}

type GetInventoryClient = typeof client<GetInventoryQueryResponse, never, never>
type GetInventory = {
  data: GetInventoryQueryResponse
  error: never
  request: never
  pathParams: never
  queryParams: never
  headerParams: never
  response: GetInventoryQueryResponse
  client: {
    paramaters: Partial<Parameters<GetInventoryClient>[0]>
    return: Awaited<ReturnType<GetInventoryClient>>
  }
}
export const getInventoryQueryKey = () => [{ url: '/store/inventory' }] as const
export type GetInventoryQueryKey = ReturnType<typeof getInventoryQueryKey>
export function getInventoryQueryOptions<
  TQueryFnData extends GetInventory['data'] = GetInventory['data'],
  TError = GetInventory['error'],
  TData = GetInventory['response'],
  TQueryData = GetInventory['response'],
>(options: GetInventory['client']['paramaters'] = {}): WithRequired<UseBaseQueryOptions<GetInventory['response'], TError, TData, TQueryData>, 'queryKey'> {
  const queryKey = getInventoryQueryKey()
  return {
    queryKey,
    queryFn: async () => {
      const res = await client<TQueryFnData, TError>({
        method: 'get',
        url: `/store/inventory`,
        ...options,
      })
      return res.data
    },
  }
}
/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory */
export function useGetInventory<
  TQueryFnData extends GetInventory['data'] = GetInventory['data'],
  TError = GetInventory['error'],
  TData = GetInventory['response'],
  TQueryData = GetInventory['response'],
  TQueryKey extends QueryKey = GetInventoryQueryKey,
>(options: {
  query?: UseBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  client?: GetInventory['client']['paramaters']
} = {}): UseQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getInventoryQueryKey()
  const query = useQuery<TQueryFnData, TError, TData, any>({
    ...getInventoryQueryOptions<TQueryFnData, TError, TData, TQueryData>(clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}

type PlaceOrderClient = typeof client<PlaceOrderMutationResponse, PlaceOrder405, PlaceOrderMutationRequest>
type PlaceOrder = {
  data: PlaceOrderMutationResponse
  error: PlaceOrder405
  request: PlaceOrderMutationRequest
  pathParams: never
  queryParams: never
  headerParams: never
  response: PlaceOrderMutationResponse
  client: {
    paramaters: Partial<Parameters<PlaceOrderClient>[0]>
    return: Awaited<ReturnType<PlaceOrderClient>>
  }
}
/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * @link /store/order */
export function usePlaceOrder(options: {
  mutation?: UseMutationOptions<PlaceOrder['response'], PlaceOrder['error'], PlaceOrder['request']>
  client?: PlaceOrder['client']['paramaters']
} = {}): UseMutationResult<PlaceOrder['response'], PlaceOrder['error'], PlaceOrder['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<PlaceOrder['response'], PlaceOrder['error'], PlaceOrder['request']>({
    mutationFn: async (data) => {
      const res = await client<PlaceOrder['data'], PlaceOrder['error'], PlaceOrder['request']>({
        method: 'post',
        url: `/store/order`,
        data,
        ...clientOptions,
      })
      return res.data
    },
    ...mutationOptions,
  })
}

type PlaceOrderPatchClient = typeof client<PlaceOrderPatchMutationResponse, PlaceOrderPatch405, PlaceOrderPatchMutationRequest>
type PlaceOrderPatch = {
  data: PlaceOrderPatchMutationResponse
  error: PlaceOrderPatch405
  request: PlaceOrderPatchMutationRequest
  pathParams: never
  queryParams: never
  headerParams: never
  response: PlaceOrderPatchMutationResponse
  client: {
    paramaters: Partial<Parameters<PlaceOrderPatchClient>[0]>
    return: Awaited<ReturnType<PlaceOrderPatchClient>>
  }
}
/**
 * @description Place a new order in the store with patch
 * @summary Place an order for a pet with patch
 * @link /store/order */
export function usePlaceOrderPatch(options: {
  mutation?: UseMutationOptions<PlaceOrderPatch['response'], PlaceOrderPatch['error'], PlaceOrderPatch['request']>
  client?: PlaceOrderPatch['client']['paramaters']
} = {}): UseMutationResult<PlaceOrderPatch['response'], PlaceOrderPatch['error'], PlaceOrderPatch['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<PlaceOrderPatch['response'], PlaceOrderPatch['error'], PlaceOrderPatch['request']>({
    mutationFn: async (data) => {
      const res = await client<PlaceOrderPatch['data'], PlaceOrderPatch['error'], PlaceOrderPatch['request']>({
        method: 'patch',
        url: `/store/order`,
        data,
        ...clientOptions,
      })
      return res.data
    },
    ...mutationOptions,
  })
}

type GetOrderByIdClient = typeof client<GetOrderByIdQueryResponse, GetOrderById400 | GetOrderById404, never>
type GetOrderById = {
  data: GetOrderByIdQueryResponse
  error: GetOrderById400 | GetOrderById404
  request: never
  pathParams: GetOrderByIdPathParams
  queryParams: never
  headerParams: never
  response: GetOrderByIdQueryResponse
  client: {
    paramaters: Partial<Parameters<GetOrderByIdClient>[0]>
    return: Awaited<ReturnType<GetOrderByIdClient>>
  }
}
export const getOrderByIdQueryKey = (orderId: GetOrderByIdPathParams['orderId']) => [{ url: '/store/order/:orderId', params: { orderId: orderId } }] as const
export type GetOrderByIdQueryKey = ReturnType<typeof getOrderByIdQueryKey>
export function getOrderByIdQueryOptions<
  TQueryFnData extends GetOrderById['data'] = GetOrderById['data'],
  TError = GetOrderById['error'],
  TData = GetOrderById['response'],
  TQueryData = GetOrderById['response'],
>(
  orderId: GetOrderByIdPathParams['orderId'],
  options: GetOrderById['client']['paramaters'] = {},
): WithRequired<UseBaseQueryOptions<GetOrderById['response'], TError, TData, TQueryData>, 'queryKey'> {
  const queryKey = getOrderByIdQueryKey(orderId)
  return {
    queryKey,
    queryFn: async () => {
      const res = await client<TQueryFnData, TError>({
        method: 'get',
        url: `/store/order/${orderId}`,
        ...options,
      })
      return res.data
    },
  }
}
/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/:orderId */
export function useGetOrderById<
  TQueryFnData extends GetOrderById['data'] = GetOrderById['data'],
  TError = GetOrderById['error'],
  TData = GetOrderById['response'],
  TQueryData = GetOrderById['response'],
  TQueryKey extends QueryKey = GetOrderByIdQueryKey,
>(orderId: GetOrderByIdPathParams['orderId'], options: {
  query?: UseBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  client?: GetOrderById['client']['paramaters']
} = {}): UseQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getOrderByIdQueryKey(orderId)
  const query = useQuery<TQueryFnData, TError, TData, any>({
    ...getOrderByIdQueryOptions<TQueryFnData, TError, TData, TQueryData>(orderId, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}

type DeleteOrderClient = typeof client<DeleteOrderMutationResponse, DeleteOrder400 | DeleteOrder404, never>
type DeleteOrder = {
  data: DeleteOrderMutationResponse
  error: DeleteOrder400 | DeleteOrder404
  request: never
  pathParams: DeleteOrderPathParams
  queryParams: never
  headerParams: never
  response: DeleteOrderMutationResponse
  client: {
    paramaters: Partial<Parameters<DeleteOrderClient>[0]>
    return: Awaited<ReturnType<DeleteOrderClient>>
  }
}
/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * @link /store/order/:orderId */
export function useDeleteOrder(orderId: DeleteOrderPathParams['orderId'], options: {
  mutation?: UseMutationOptions<DeleteOrder['response'], DeleteOrder['error'], void>
  client?: DeleteOrder['client']['paramaters']
} = {}): UseMutationResult<DeleteOrder['response'], DeleteOrder['error'], void> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<DeleteOrder['response'], DeleteOrder['error'], void>({
    mutationFn: async () => {
      const res = await client<DeleteOrder['data'], DeleteOrder['error'], void>({
        method: 'delete',
        url: `/store/order/${orderId}`,
        ...clientOptions,
      })
      return res.data
    },
    ...mutationOptions,
  })
}

type CreateUserClient = typeof client<CreateUserMutationResponse, CreateUserError, CreateUserMutationRequest>
type CreateUser = {
  data: CreateUserMutationResponse
  error: CreateUserError
  request: CreateUserMutationRequest
  pathParams: never
  queryParams: never
  headerParams: never
  response: CreateUserMutationResponse
  client: {
    paramaters: Partial<Parameters<CreateUserClient>[0]>
    return: Awaited<ReturnType<CreateUserClient>>
  }
}
/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * @link /user */
export function useCreateUser(options: {
  mutation?: UseMutationOptions<CreateUser['response'], CreateUser['error'], CreateUser['request']>
  client?: CreateUser['client']['paramaters']
} = {}): UseMutationResult<CreateUser['response'], CreateUser['error'], CreateUser['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<CreateUser['response'], CreateUser['error'], CreateUser['request']>({
    mutationFn: async (data) => {
      const res = await client<CreateUser['data'], CreateUser['error'], CreateUser['request']>({
        method: 'post',
        url: `/user`,
        data,
        ...clientOptions,
      })
      return res.data
    },
    ...mutationOptions,
  })
}

type CreateUsersWithListInputClient = typeof client<
  CreateUsersWithListInputMutationResponse,
  CreateUsersWithListInputError,
  CreateUsersWithListInputMutationRequest
>
type CreateUsersWithListInput = {
  data: CreateUsersWithListInputMutationResponse
  error: CreateUsersWithListInputError
  request: CreateUsersWithListInputMutationRequest
  pathParams: never
  queryParams: never
  headerParams: never
  response: CreateUsersWithListInputMutationResponse
  client: {
    paramaters: Partial<Parameters<CreateUsersWithListInputClient>[0]>
    return: Awaited<ReturnType<CreateUsersWithListInputClient>>
  }
}
/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * @link /user/createWithList */
export function useCreateUsersWithListInput(options: {
  mutation?: UseMutationOptions<CreateUsersWithListInput['response'], CreateUsersWithListInput['error'], CreateUsersWithListInput['request']>
  client?: CreateUsersWithListInput['client']['paramaters']
} = {}): UseMutationResult<CreateUsersWithListInput['response'], CreateUsersWithListInput['error'], CreateUsersWithListInput['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<CreateUsersWithListInput['response'], CreateUsersWithListInput['error'], CreateUsersWithListInput['request']>({
    mutationFn: async (data) => {
      const res = await client<CreateUsersWithListInput['data'], CreateUsersWithListInput['error'], CreateUsersWithListInput['request']>({
        method: 'post',
        url: `/user/createWithList`,
        data,
        ...clientOptions,
      })
      return res.data
    },
    ...mutationOptions,
  })
}

type LoginUserClient = typeof client<LoginUserQueryResponse, LoginUser400, never>
type LoginUser = {
  data: LoginUserQueryResponse
  error: LoginUser400
  request: never
  pathParams: never
  queryParams: LoginUserQueryParams
  headerParams: never
  response: LoginUserQueryResponse
  client: {
    paramaters: Partial<Parameters<LoginUserClient>[0]>
    return: Awaited<ReturnType<LoginUserClient>>
  }
}
export const loginUserQueryKey = (params?: LoginUser['queryParams']) => [{ url: '/user/login' }, ...(params ? [params] : [])] as const
export type LoginUserQueryKey = ReturnType<typeof loginUserQueryKey>
export function loginUserQueryOptions<
  TQueryFnData extends LoginUser['data'] = LoginUser['data'],
  TError = LoginUser['error'],
  TData = LoginUser['response'],
  TQueryData = LoginUser['response'],
>(
  params?: LoginUser['queryParams'],
  options: LoginUser['client']['paramaters'] = {},
): WithRequired<UseBaseQueryOptions<LoginUser['response'], TError, TData, TQueryData>, 'queryKey'> {
  const queryKey = loginUserQueryKey(params)
  return {
    queryKey,
    queryFn: async () => {
      const res = await client<TQueryFnData, TError>({
        method: 'get',
        url: `/user/login`,
        params,
        ...options,
      })
      return res.data
    },
  }
}
/**
 * @summary Logs user into the system
 * @link /user/login */
export function useLoginUser<
  TQueryFnData extends LoginUser['data'] = LoginUser['data'],
  TError = LoginUser['error'],
  TData = LoginUser['response'],
  TQueryData = LoginUser['response'],
  TQueryKey extends QueryKey = LoginUserQueryKey,
>(params?: LoginUser['queryParams'], options: {
  query?: UseBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  client?: LoginUser['client']['paramaters']
} = {}): UseQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserQueryKey(params)
  const query = useQuery<TQueryFnData, TError, TData, any>({
    ...loginUserQueryOptions<TQueryFnData, TError, TData, TQueryData>(params, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}

type LogoutUserClient = typeof client<LogoutUserQueryResponse, LogoutUserError, never>
type LogoutUser = {
  data: LogoutUserQueryResponse
  error: LogoutUserError
  request: never
  pathParams: never
  queryParams: never
  headerParams: never
  response: LogoutUserQueryResponse
  client: {
    paramaters: Partial<Parameters<LogoutUserClient>[0]>
    return: Awaited<ReturnType<LogoutUserClient>>
  }
}
export const logoutUserQueryKey = () => [{ url: '/user/logout' }] as const
export type LogoutUserQueryKey = ReturnType<typeof logoutUserQueryKey>
export function logoutUserQueryOptions<
  TQueryFnData extends LogoutUser['data'] = LogoutUser['data'],
  TError = LogoutUser['error'],
  TData = LogoutUser['response'],
  TQueryData = LogoutUser['response'],
>(options: LogoutUser['client']['paramaters'] = {}): WithRequired<UseBaseQueryOptions<LogoutUser['response'], TError, TData, TQueryData>, 'queryKey'> {
  const queryKey = logoutUserQueryKey()
  return {
    queryKey,
    queryFn: async () => {
      const res = await client<TQueryFnData, TError>({
        method: 'get',
        url: `/user/logout`,
        ...options,
      })
      return res.data
    },
  }
}
/**
 * @summary Logs out current logged in user session
 * @link /user/logout */
export function useLogoutUser<
  TQueryFnData extends LogoutUser['data'] = LogoutUser['data'],
  TError = LogoutUser['error'],
  TData = LogoutUser['response'],
  TQueryData = LogoutUser['response'],
  TQueryKey extends QueryKey = LogoutUserQueryKey,
>(options: {
  query?: UseBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  client?: LogoutUser['client']['paramaters']
} = {}): UseQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? logoutUserQueryKey()
  const query = useQuery<TQueryFnData, TError, TData, any>({
    ...logoutUserQueryOptions<TQueryFnData, TError, TData, TQueryData>(clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}

type GetUserByNameClient = typeof client<GetUserByNameQueryResponse, GetUserByName400 | GetUserByName404, never>
type GetUserByName = {
  data: GetUserByNameQueryResponse
  error: GetUserByName400 | GetUserByName404
  request: never
  pathParams: GetUserByNamePathParams
  queryParams: never
  headerParams: never
  response: GetUserByNameQueryResponse
  client: {
    paramaters: Partial<Parameters<GetUserByNameClient>[0]>
    return: Awaited<ReturnType<GetUserByNameClient>>
  }
}
export const getUserByNameQueryKey = (username: GetUserByNamePathParams['username']) => [{ url: '/user/:username', params: { username: username } }] as const
export type GetUserByNameQueryKey = ReturnType<typeof getUserByNameQueryKey>
export function getUserByNameQueryOptions<
  TQueryFnData extends GetUserByName['data'] = GetUserByName['data'],
  TError = GetUserByName['error'],
  TData = GetUserByName['response'],
  TQueryData = GetUserByName['response'],
>(
  username: GetUserByNamePathParams['username'],
  options: GetUserByName['client']['paramaters'] = {},
): WithRequired<UseBaseQueryOptions<GetUserByName['response'], TError, TData, TQueryData>, 'queryKey'> {
  const queryKey = getUserByNameQueryKey(username)
  return {
    queryKey,
    queryFn: async () => {
      const res = await client<TQueryFnData, TError>({
        method: 'get',
        url: `/user/${username}`,
        ...options,
      })
      return res.data
    },
  }
}
/**
 * @summary Get user by user name
 * @link /user/:username */
export function useGetUserByName<
  TQueryFnData extends GetUserByName['data'] = GetUserByName['data'],
  TError = GetUserByName['error'],
  TData = GetUserByName['response'],
  TQueryData = GetUserByName['response'],
  TQueryKey extends QueryKey = GetUserByNameQueryKey,
>(username: GetUserByNamePathParams['username'], options: {
  query?: UseBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  client?: GetUserByName['client']['paramaters']
} = {}): UseQueryResult<TData, TError> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameQueryKey(username)
  const query = useQuery<TQueryFnData, TError, TData, any>({
    ...getUserByNameQueryOptions<TQueryFnData, TError, TData, TQueryData>(username, clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}

type UpdateUserClient = typeof client<UpdateUserMutationResponse, UpdateUserError, UpdateUserMutationRequest>
type UpdateUser = {
  data: UpdateUserMutationResponse
  error: UpdateUserError
  request: UpdateUserMutationRequest
  pathParams: UpdateUserPathParams
  queryParams: never
  headerParams: never
  response: UpdateUserMutationResponse
  client: {
    paramaters: Partial<Parameters<UpdateUserClient>[0]>
    return: Awaited<ReturnType<UpdateUserClient>>
  }
}
/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username */
export function useUpdateUser(username: UpdateUserPathParams['username'], options: {
  mutation?: UseMutationOptions<UpdateUser['response'], UpdateUser['error'], UpdateUser['request']>
  client?: UpdateUser['client']['paramaters']
} = {}): UseMutationResult<UpdateUser['response'], UpdateUser['error'], UpdateUser['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<UpdateUser['response'], UpdateUser['error'], UpdateUser['request']>({
    mutationFn: async (data) => {
      const res = await client<UpdateUser['data'], UpdateUser['error'], UpdateUser['request']>({
        method: 'put',
        url: `/user/${username}`,
        data,
        ...clientOptions,
      })
      return res.data
    },
    ...mutationOptions,
  })
}

type DeleteUserClient = typeof client<DeleteUserMutationResponse, DeleteUser400 | DeleteUser404, never>
type DeleteUser = {
  data: DeleteUserMutationResponse
  error: DeleteUser400 | DeleteUser404
  request: never
  pathParams: DeleteUserPathParams
  queryParams: never
  headerParams: never
  response: DeleteUserMutationResponse
  client: {
    paramaters: Partial<Parameters<DeleteUserClient>[0]>
    return: Awaited<ReturnType<DeleteUserClient>>
  }
}
/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * @link /user/:username */
export function useDeleteUser(username: DeleteUserPathParams['username'], options: {
  mutation?: UseMutationOptions<DeleteUser['response'], DeleteUser['error'], void>
  client?: DeleteUser['client']['paramaters']
} = {}): UseMutationResult<DeleteUser['response'], DeleteUser['error'], void> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<DeleteUser['response'], DeleteUser['error'], void>({
    mutationFn: async () => {
      const res = await client<DeleteUser['data'], DeleteUser['error'], void>({
        method: 'delete',
        url: `/user/${username}`,
        ...clientOptions,
      })
      return res.data
    },
    ...mutationOptions,
  })
}
