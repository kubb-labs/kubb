import client from '@kubb/swagger-client/client'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { KubbQueryFactory } from './types'
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
import type { UseMutationOptions, UseMutationResult, QueryKey, UseBaseQueryOptions, UseQueryResult } from '@tanstack/react-query'

type UpdatePet = KubbQueryFactory<
  UpdatePetMutationResponse,
  UpdatePet400 | UpdatePet404 | UpdatePet405,
  UpdatePetMutationRequest,
  never,
  never,
  never,
  UpdatePetMutationResponse,
  {
    dataReturnType: 'full'
    type: 'mutation'
  }
>
/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet
 */
export function useUpdatePet<TData = UpdatePet['response'], TError = UpdatePet['error']>(options: {
  mutation?: UseMutationOptions<TData, TError, UpdatePet['request']>
  client?: UpdatePet['client']['paramaters']
} = {}): UseMutationResult<TData, TError, UpdatePet['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<TData, TError, UpdatePet['request']>({
    mutationFn: (data) => {
      return client<UpdatePet['data'], TError, UpdatePet['request']>({
        method: 'put',
        url: `/pet`,
        data,
        ...clientOptions,
      }).then(res => res as TData)
    },
    ...mutationOptions,
  })
}

type AddPet = KubbQueryFactory<AddPetMutationResponse, AddPet405, AddPetMutationRequest, never, never, never, AddPetMutationResponse, {
  dataReturnType: 'full'
  type: 'mutation'
}>
/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet
 */
export function useAddPet<TData = AddPet['response'], TError = AddPet['error']>(options: {
  mutation?: UseMutationOptions<TData, TError, AddPet['request']>
  client?: AddPet['client']['paramaters']
} = {}): UseMutationResult<TData, TError, AddPet['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<TData, TError, AddPet['request']>({
    mutationFn: (data) => {
      return client<AddPet['data'], TError, AddPet['request']>({
        method: 'post',
        url: `/pet`,
        data,
        ...clientOptions,
      }).then(res => res as TData)
    },
    ...mutationOptions,
  })
}

type FindPetsByStatus = KubbQueryFactory<
  FindPetsByStatusQueryResponse,
  FindPetsByStatus400,
  never,
  never,
  FindPetsByStatusQueryParams,
  never,
  FindPetsByStatusQueryResponse,
  {
    dataReturnType: 'data'
    type: 'query'
  }
>
export const findPetsByStatusQueryKey = (params?: FindPetsByStatus['queryParams']) => [{ url: `/pet/findByStatus` }, ...(params ? [params] : [])] as const
export type FindPetsByStatusQueryKey = ReturnType<typeof findPetsByStatusQueryKey>
export function findPetsByStatusQueryOptions<
  TQueryFnData extends FindPetsByStatus['data'] = FindPetsByStatus['data'],
  TError = FindPetsByStatus['error'],
  TData = FindPetsByStatus['response'],
  TQueryData = FindPetsByStatus['response'],
>(
  params?: FindPetsByStatus['queryParams'],
  options: FindPetsByStatus['client']['paramaters'] = {},
): UseBaseQueryOptions<FindPetsByStatus['unionResponse'], TError, TData, TQueryData, FindPetsByStatusQueryKey> {
  const queryKey = findPetsByStatusQueryKey(params)

  return {
    queryKey,
    queryFn: () => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/pet/findByStatus`,
        params,
        ...options,
      }).then(res => res?.data || res)
    },
  }
}
/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */
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

type FindPetsByTags = KubbQueryFactory<
  FindPetsByTagsQueryResponse,
  FindPetsByTags400,
  never,
  never,
  FindPetsByTagsQueryParams,
  never,
  FindPetsByTagsQueryResponse,
  {
    dataReturnType: 'data'
    type: 'query'
  }
>
export const findPetsByTagsQueryKey = (params?: FindPetsByTags['queryParams']) => [{ url: `/pet/findByTags` }, ...(params ? [params] : [])] as const
export type FindPetsByTagsQueryKey = ReturnType<typeof findPetsByTagsQueryKey>
export function findPetsByTagsQueryOptions<
  TQueryFnData extends FindPetsByTags['data'] = FindPetsByTags['data'],
  TError = FindPetsByTags['error'],
  TData = FindPetsByTags['response'],
  TQueryData = FindPetsByTags['response'],
>(
  params?: FindPetsByTags['queryParams'],
  options: FindPetsByTags['client']['paramaters'] = {},
): UseBaseQueryOptions<FindPetsByTags['unionResponse'], TError, TData, TQueryData, FindPetsByTagsQueryKey> {
  const queryKey = findPetsByTagsQueryKey(params)

  return {
    queryKey,
    queryFn: () => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/pet/findByTags`,
        params,
        ...options,
      }).then(res => res?.data || res)
    },
  }
}
/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
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

type GetPetById = KubbQueryFactory<GetPetByIdQueryResponse, GetPetById400 | GetPetById404, never, GetPetByIdPathParams, never, never, GetPetByIdQueryResponse, {
  dataReturnType: 'data'
  type: 'query'
}>
export const getPetByIdQueryKey = (petId: GetPetByIdPathParams['petId']) => [{ url: `/pet/${petId}`, params: { petId: petId } }] as const
export type GetPetByIdQueryKey = ReturnType<typeof getPetByIdQueryKey>
export function getPetByIdQueryOptions<
  TQueryFnData extends GetPetById['data'] = GetPetById['data'],
  TError = GetPetById['error'],
  TData = GetPetById['response'],
  TQueryData = GetPetById['response'],
>(
  petId: GetPetByIdPathParams['petId'],
  options: GetPetById['client']['paramaters'] = {},
): UseBaseQueryOptions<GetPetById['unionResponse'], TError, TData, TQueryData, GetPetByIdQueryKey> {
  const queryKey = getPetByIdQueryKey(petId)

  return {
    queryKey,
    queryFn: () => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/pet/${petId}`,
        ...options,
      }).then(res => res?.data || res)
    },
  }
}
/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
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

type UpdatePetWithForm = KubbQueryFactory<
  UpdatePetWithFormMutationResponse,
  UpdatePetWithForm405,
  never,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  never,
  UpdatePetWithFormMutationResponse,
  {
    dataReturnType: 'full'
    type: 'mutation'
  }
>
/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function useUpdatePetWithForm<TData = UpdatePetWithForm['response'], TError = UpdatePetWithForm['error']>(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatePetWithForm['queryParams'],
  options: {
    mutation?: UseMutationOptions<TData, TError, void>
    client?: UpdatePetWithForm['client']['paramaters']
  } = {},
): UseMutationResult<TData, TError, void> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<TData, TError, void>({
    mutationFn: () => {
      return client<UpdatePetWithForm['data'], TError, void>({
        method: 'post',
        url: `/pet/${petId}`,
        params,
        ...clientOptions,
      }).then(res => res as TData)
    },
    ...mutationOptions,
  })
}

type DeletePet = KubbQueryFactory<
  DeletePetMutationResponse,
  DeletePet400,
  never,
  DeletePetPathParams,
  never,
  DeletePetHeaderParams,
  DeletePetMutationResponse,
  {
    dataReturnType: 'full'
    type: 'mutation'
  }
>
/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/:petId
 */
export function useDeletePet<TData = DeletePet['response'], TError = DeletePet['error']>(
  petId: DeletePetPathParams['petId'],
  headers?: DeletePet['headerParams'],
  options: {
    mutation?: UseMutationOptions<TData, TError, void>
    client?: DeletePet['client']['paramaters']
  } = {},
): UseMutationResult<TData, TError, void> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<TData, TError, void>({
    mutationFn: () => {
      return client<DeletePet['data'], TError, void>({
        method: 'delete',
        url: `/pet/${petId}`,
        headers: { ...headers, ...clientOptions.headers },
        ...clientOptions,
      }).then(res => res as TData)
    },
    ...mutationOptions,
  })
}

type UploadFile = KubbQueryFactory<
  UploadFileMutationResponse,
  never,
  UploadFileMutationRequest,
  UploadFilePathParams,
  UploadFileQueryParams,
  never,
  UploadFileMutationResponse,
  {
    dataReturnType: 'full'
    type: 'mutation'
  }
>
/**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage
 */
export function useUploadFile<TData = UploadFile['response'], TError = UploadFile['error']>(
  petId: UploadFilePathParams['petId'],
  params?: UploadFile['queryParams'],
  options: {
    mutation?: UseMutationOptions<TData, TError, UploadFile['request']>
    client?: UploadFile['client']['paramaters']
  } = {},
): UseMutationResult<TData, TError, UploadFile['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<TData, TError, UploadFile['request']>({
    mutationFn: (data) => {
      return client<UploadFile['data'], TError, UploadFile['request']>({
        method: 'post',
        url: `/pet/${petId}/uploadImage`,
        params,
        data,
        ...clientOptions,
      }).then(res => res as TData)
    },
    ...mutationOptions,
  })
}

type GetInventory = KubbQueryFactory<GetInventoryQueryResponse, never, never, never, never, never, GetInventoryQueryResponse, {
  dataReturnType: 'data'
  type: 'query'
}>
export const getInventoryQueryKey = () => [{ url: `/store/inventory` }] as const
export type GetInventoryQueryKey = ReturnType<typeof getInventoryQueryKey>
export function getInventoryQueryOptions<
  TQueryFnData extends GetInventory['data'] = GetInventory['data'],
  TError = GetInventory['error'],
  TData = GetInventory['response'],
  TQueryData = GetInventory['response'],
>(options: GetInventory['client']['paramaters'] = {}): UseBaseQueryOptions<GetInventory['unionResponse'], TError, TData, TQueryData, GetInventoryQueryKey> {
  const queryKey = getInventoryQueryKey()

  return {
    queryKey,
    queryFn: () => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/store/inventory`,
        ...options,
      }).then(res => res?.data || res)
    },
  }
}
/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory
 */
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

type PlaceOrder = KubbQueryFactory<PlaceOrderMutationResponse, PlaceOrder405, PlaceOrderMutationRequest, never, never, never, PlaceOrderMutationResponse, {
  dataReturnType: 'full'
  type: 'mutation'
}>
/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * @link /store/order
 */
export function usePlaceOrder<TData = PlaceOrder['response'], TError = PlaceOrder['error']>(options: {
  mutation?: UseMutationOptions<TData, TError, PlaceOrder['request']>
  client?: PlaceOrder['client']['paramaters']
} = {}): UseMutationResult<TData, TError, PlaceOrder['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<TData, TError, PlaceOrder['request']>({
    mutationFn: (data) => {
      return client<PlaceOrder['data'], TError, PlaceOrder['request']>({
        method: 'post',
        url: `/store/order`,
        data,
        ...clientOptions,
      }).then(res => res as TData)
    },
    ...mutationOptions,
  })
}

type PlaceOrderPatch = KubbQueryFactory<
  PlaceOrderPatchMutationResponse,
  PlaceOrderPatch405,
  PlaceOrderPatchMutationRequest,
  never,
  never,
  never,
  PlaceOrderPatchMutationResponse,
  {
    dataReturnType: 'full'
    type: 'mutation'
  }
>
/**
 * @description Place a new order in the store with patch
 * @summary Place an order for a pet with patch
 * @link /store/order
 */
export function usePlaceOrderPatch<TData = PlaceOrderPatch['response'], TError = PlaceOrderPatch['error']>(options: {
  mutation?: UseMutationOptions<TData, TError, PlaceOrderPatch['request']>
  client?: PlaceOrderPatch['client']['paramaters']
} = {}): UseMutationResult<TData, TError, PlaceOrderPatch['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<TData, TError, PlaceOrderPatch['request']>({
    mutationFn: (data) => {
      return client<PlaceOrderPatch['data'], TError, PlaceOrderPatch['request']>({
        method: 'patch',
        url: `/store/order`,
        data,
        ...clientOptions,
      }).then(res => res as TData)
    },
    ...mutationOptions,
  })
}

type GetOrderById = KubbQueryFactory<
  GetOrderByIdQueryResponse,
  GetOrderById400 | GetOrderById404,
  never,
  GetOrderByIdPathParams,
  never,
  never,
  GetOrderByIdQueryResponse,
  {
    dataReturnType: 'data'
    type: 'query'
  }
>
export const getOrderByIdQueryKey = (orderId: GetOrderByIdPathParams['orderId']) => [{ url: `/store/order/${orderId}`, params: { orderId: orderId } }] as const
export type GetOrderByIdQueryKey = ReturnType<typeof getOrderByIdQueryKey>
export function getOrderByIdQueryOptions<
  TQueryFnData extends GetOrderById['data'] = GetOrderById['data'],
  TError = GetOrderById['error'],
  TData = GetOrderById['response'],
  TQueryData = GetOrderById['response'],
>(
  orderId: GetOrderByIdPathParams['orderId'],
  options: GetOrderById['client']['paramaters'] = {},
): UseBaseQueryOptions<GetOrderById['unionResponse'], TError, TData, TQueryData, GetOrderByIdQueryKey> {
  const queryKey = getOrderByIdQueryKey(orderId)

  return {
    queryKey,
    queryFn: () => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/store/order/${orderId}`,
        ...options,
      }).then(res => res?.data || res)
    },
  }
}
/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/:orderId
 */
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

type DeleteOrder = KubbQueryFactory<
  DeleteOrderMutationResponse,
  DeleteOrder400 | DeleteOrder404,
  never,
  DeleteOrderPathParams,
  never,
  never,
  DeleteOrderMutationResponse,
  {
    dataReturnType: 'full'
    type: 'mutation'
  }
>
/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * @link /store/order/:orderId
 */
export function useDeleteOrder<TData = DeleteOrder['response'], TError = DeleteOrder['error']>(orderId: DeleteOrderPathParams['orderId'], options: {
  mutation?: UseMutationOptions<TData, TError, void>
  client?: DeleteOrder['client']['paramaters']
} = {}): UseMutationResult<TData, TError, void> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<TData, TError, void>({
    mutationFn: () => {
      return client<DeleteOrder['data'], TError, void>({
        method: 'delete',
        url: `/store/order/${orderId}`,
        ...clientOptions,
      }).then(res => res as TData)
    },
    ...mutationOptions,
  })
}

type CreateUser = KubbQueryFactory<CreateUserMutationResponse, CreateUserError, CreateUserMutationRequest, never, never, never, CreateUserMutationResponse, {
  dataReturnType: 'full'
  type: 'mutation'
}>
/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * @link /user
 */
export function useCreateUser<TData = CreateUser['response'], TError = CreateUser['error']>(options: {
  mutation?: UseMutationOptions<TData, TError, CreateUser['request']>
  client?: CreateUser['client']['paramaters']
} = {}): UseMutationResult<TData, TError, CreateUser['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<TData, TError, CreateUser['request']>({
    mutationFn: (data) => {
      return client<CreateUser['data'], TError, CreateUser['request']>({
        method: 'post',
        url: `/user`,
        data,
        ...clientOptions,
      }).then(res => res as TData)
    },
    ...mutationOptions,
  })
}

type CreateUsersWithListInput = KubbQueryFactory<
  CreateUsersWithListInputMutationResponse,
  CreateUsersWithListInputError,
  CreateUsersWithListInputMutationRequest,
  never,
  never,
  never,
  CreateUsersWithListInputMutationResponse,
  {
    dataReturnType: 'full'
    type: 'mutation'
  }
>
/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * @link /user/createWithList
 */
export function useCreateUsersWithListInput<TData = CreateUsersWithListInput['response'], TError = CreateUsersWithListInput['error']>(options: {
  mutation?: UseMutationOptions<TData, TError, CreateUsersWithListInput['request']>
  client?: CreateUsersWithListInput['client']['paramaters']
} = {}): UseMutationResult<TData, TError, CreateUsersWithListInput['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<TData, TError, CreateUsersWithListInput['request']>({
    mutationFn: (data) => {
      return client<CreateUsersWithListInput['data'], TError, CreateUsersWithListInput['request']>({
        method: 'post',
        url: `/user/createWithList`,
        data,
        ...clientOptions,
      }).then(res => res as TData)
    },
    ...mutationOptions,
  })
}

type LoginUser = KubbQueryFactory<LoginUserQueryResponse, LoginUser400, never, never, LoginUserQueryParams, never, LoginUserQueryResponse, {
  dataReturnType: 'data'
  type: 'query'
}>
export const loginUserQueryKey = (params?: LoginUser['queryParams']) => [{ url: `/user/login` }, ...(params ? [params] : [])] as const
export type LoginUserQueryKey = ReturnType<typeof loginUserQueryKey>
export function loginUserQueryOptions<
  TQueryFnData extends LoginUser['data'] = LoginUser['data'],
  TError = LoginUser['error'],
  TData = LoginUser['response'],
  TQueryData = LoginUser['response'],
>(
  params?: LoginUser['queryParams'],
  options: LoginUser['client']['paramaters'] = {},
): UseBaseQueryOptions<LoginUser['unionResponse'], TError, TData, TQueryData, LoginUserQueryKey> {
  const queryKey = loginUserQueryKey(params)

  return {
    queryKey,
    queryFn: () => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/user/login`,
        params,
        ...options,
      }).then(res => res?.data || res)
    },
  }
}
/**
 * @summary Logs user into the system
 * @link /user/login
 */
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

type LogoutUser = KubbQueryFactory<LogoutUserQueryResponse, never, never, never, never, never, LogoutUserQueryResponse, {
  dataReturnType: 'data'
  type: 'query'
}>
export const logoutUserQueryKey = () => [{ url: `/user/logout` }] as const
export type LogoutUserQueryKey = ReturnType<typeof logoutUserQueryKey>
export function logoutUserQueryOptions<
  TQueryFnData extends LogoutUser['data'] = LogoutUser['data'],
  TError = LogoutUser['error'],
  TData = LogoutUser['response'],
  TQueryData = LogoutUser['response'],
>(options: LogoutUser['client']['paramaters'] = {}): UseBaseQueryOptions<LogoutUser['unionResponse'], TError, TData, TQueryData, LogoutUserQueryKey> {
  const queryKey = logoutUserQueryKey()

  return {
    queryKey,
    queryFn: () => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/user/logout`,
        ...options,
      }).then(res => res?.data || res)
    },
  }
}
/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
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

type GetUserByName = KubbQueryFactory<
  GetUserByNameQueryResponse,
  GetUserByName400 | GetUserByName404,
  never,
  GetUserByNamePathParams,
  never,
  never,
  GetUserByNameQueryResponse,
  {
    dataReturnType: 'data'
    type: 'query'
  }
>
export const getUserByNameQueryKey = (username: GetUserByNamePathParams['username']) => [{ url: `/user/${username}`, params: { username: username } }] as const
export type GetUserByNameQueryKey = ReturnType<typeof getUserByNameQueryKey>
export function getUserByNameQueryOptions<
  TQueryFnData extends GetUserByName['data'] = GetUserByName['data'],
  TError = GetUserByName['error'],
  TData = GetUserByName['response'],
  TQueryData = GetUserByName['response'],
>(
  username: GetUserByNamePathParams['username'],
  options: GetUserByName['client']['paramaters'] = {},
): UseBaseQueryOptions<GetUserByName['unionResponse'], TError, TData, TQueryData, GetUserByNameQueryKey> {
  const queryKey = getUserByNameQueryKey(username)

  return {
    queryKey,
    queryFn: () => {
      return client<TQueryFnData, TError>({
        method: 'get',
        url: `/user/${username}`,
        ...options,
      }).then(res => res?.data || res)
    },
  }
}
/**
 * @summary Get user by user name
 * @link /user/:username
 */
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

type UpdateUser = KubbQueryFactory<
  UpdateUserMutationResponse,
  UpdateUserError,
  UpdateUserMutationRequest,
  UpdateUserPathParams,
  never,
  never,
  UpdateUserMutationResponse,
  {
    dataReturnType: 'full'
    type: 'mutation'
  }
>
/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username
 */
export function useUpdateUser<TData = UpdateUser['response'], TError = UpdateUser['error']>(username: UpdateUserPathParams['username'], options: {
  mutation?: UseMutationOptions<TData, TError, UpdateUser['request']>
  client?: UpdateUser['client']['paramaters']
} = {}): UseMutationResult<TData, TError, UpdateUser['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<TData, TError, UpdateUser['request']>({
    mutationFn: (data) => {
      return client<UpdateUser['data'], TError, UpdateUser['request']>({
        method: 'put',
        url: `/user/${username}`,
        data,
        ...clientOptions,
      }).then(res => res as TData)
    },
    ...mutationOptions,
  })
}

type DeleteUser = KubbQueryFactory<
  DeleteUserMutationResponse,
  DeleteUser400 | DeleteUser404,
  never,
  DeleteUserPathParams,
  never,
  never,
  DeleteUserMutationResponse,
  {
    dataReturnType: 'full'
    type: 'mutation'
  }
>
/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * @link /user/:username
 */
export function useDeleteUser<TData = DeleteUser['response'], TError = DeleteUser['error']>(username: DeleteUserPathParams['username'], options: {
  mutation?: UseMutationOptions<TData, TError, void>
  client?: DeleteUser['client']['paramaters']
} = {}): UseMutationResult<TData, TError, void> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<TData, TError, void>({
    mutationFn: () => {
      return client<DeleteUser['data'], TError, void>({
        method: 'delete',
        url: `/user/${username}`,
        ...clientOptions,
      }).then(res => res as TData)
    },
    ...mutationOptions,
  })
}
