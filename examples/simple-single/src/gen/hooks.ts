import type { UseMutationOptions, UseMutationResult, QueryKey, UseQueryResult, UseQueryOptions, QueryOptions } from '@tanstack/react-query'
import { useMutation, useQuery } from '@tanstack/react-query'
import client from '@kubb/swagger-client/client'
import type { ResponseConfig } from '@kubb/swagger-client/client'
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
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
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
  DeleteUserMutationResponse,
  DeleteUserPathParams,
  DeleteUser400,
  DeleteUser404,
} from './models'

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet
 */

export function useUpdatePet<TData = UpdatePetMutationResponse, TError = UpdatePet400 | UpdatePet404 | UpdatePet405, TVariables = UpdatePetMutationRequest>(
  options: {
    mutation?: UseMutationOptions<ResponseConfig<TData>, TError, TVariables>
    client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  } = {},
): UseMutationResult<ResponseConfig<TData>, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<ResponseConfig<TData>, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'put',
        url: `/pet`,
        data,

        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet
 */

export function useAddPet<TData = AddPetMutationResponse, TError = AddPet405, TVariables = AddPetMutationRequest>(
  options: {
    mutation?: UseMutationOptions<ResponseConfig<TData>, TError, TVariables>
    client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  } = {},
): UseMutationResult<ResponseConfig<TData>, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<ResponseConfig<TData>, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url: `/pet`,
        data,

        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}

export const findPetsByStatusQueryKey = (params?: FindPetsByStatusQueryParams) => [`/pet/findByStatus`, ...(params ? [params] : [])] as const

export function findPetsByStatusQueryOptions<TData = FindPetsByStatusQueryResponse, TError = FindPetsByStatus400>(
  params?: FindPetsByStatusQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<TData, TError> {
  const queryKey = findPetsByStatusQueryKey(params)

  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/pet/findByStatus`,
        params,

        ...options,
      }).then((res) => res.data)
    },
  }
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */

export function useFindPetsByStatus<TData = FindPetsByStatusQueryResponse, TError = FindPetsByStatus400>(
  params?: FindPetsByStatusQueryParams,
  options: {
    query?: UseQueryOptions<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByStatusQueryKey(params)

  const query = useQuery<TData, TError>({
    ...findPetsByStatusQueryOptions<TData, TError>(params, clientOptions),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}

export const findPetsByTagsQueryKey = (params?: FindPetsByTagsQueryParams) => [`/pet/findByTags`, ...(params ? [params] : [])] as const

export function findPetsByTagsQueryOptions<TData = FindPetsByTagsQueryResponse, TError = FindPetsByTags400>(
  params?: FindPetsByTagsQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<TData, TError> {
  const queryKey = findPetsByTagsQueryKey(params)

  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/pet/findByTags`,
        params,

        ...options,
      }).then((res) => res.data)
    },
  }
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */

export function useFindPetsByTags<TData = FindPetsByTagsQueryResponse, TError = FindPetsByTags400>(
  params?: FindPetsByTagsQueryParams,
  options: {
    query?: UseQueryOptions<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsQueryKey(params)

  const query = useQuery<TData, TError>({
    ...findPetsByTagsQueryOptions<TData, TError>(params, clientOptions),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}

export const getPetByIdQueryKey = (petId: GetPetByIdPathParams['petId']) => [`/pet/${petId}`] as const

export function getPetByIdQueryOptions<TData = GetPetByIdQueryResponse, TError = GetPetById400 | GetPetById404>(
  petId: GetPetByIdPathParams['petId'],
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<TData, TError> {
  const queryKey = getPetByIdQueryKey(petId)

  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/pet/${petId}`,

        ...options,
      }).then((res) => res.data)
    },
  }
}

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */

export function useGetPetById<TData = GetPetByIdQueryResponse, TError = GetPetById400 | GetPetById404>(
  petId: GetPetByIdPathParams['petId'],
  options: {
    query?: UseQueryOptions<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getPetByIdQueryKey(petId)

  const query = useQuery<TData, TError>({
    ...getPetByIdQueryOptions<TData, TError>(petId, clientOptions),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */

export function useUpdatePetWithForm<TData = UpdatePetWithFormMutationResponse, TError = UpdatePetWithForm405>(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatePetWithFormQueryParams,
  options: {
    mutation?: UseMutationOptions<ResponseConfig<TData>, TError, void>
    client?: Partial<Parameters<typeof client<TData, TError, void>>[0]>
  } = {},
): UseMutationResult<ResponseConfig<TData>, TError, void> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<ResponseConfig<TData>, TError, void>({
    mutationFn: () => {
      return client<TData, TError, void>({
        method: 'post',
        url: `/pet/${petId}`,

        params,

        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}

/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/:petId
 */

export function useDeletePet<TData = DeletePetMutationResponse, TError = DeletePet400>(
  petId: DeletePetPathParams['petId'],
  headers?: DeletePetHeaderParams,
  options: {
    mutation?: UseMutationOptions<ResponseConfig<TData>, TError, void>
    client?: Partial<Parameters<typeof client<TData, TError, void>>[0]>
  } = {},
): UseMutationResult<ResponseConfig<TData>, TError, void> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<ResponseConfig<TData>, TError, void>({
    mutationFn: () => {
      return client<TData, TError, void>({
        method: 'delete',
        url: `/pet/${petId}`,

        headers: { ...headers, ...clientOptions.headers },
        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}

/**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage
 */

export function useUploadFile<TData = UploadFileMutationResponse, TError = unknown, TVariables = UploadFileMutationRequest>(
  petId: UploadFilePathParams['petId'],
  params?: UploadFileQueryParams,
  options: {
    mutation?: UseMutationOptions<ResponseConfig<TData>, TError, TVariables>
    client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  } = {},
): UseMutationResult<ResponseConfig<TData>, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<ResponseConfig<TData>, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url: `/pet/${petId}/uploadImage`,
        data,
        params,

        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}

export const getInventoryQueryKey = () => [`/store/inventory`] as const

export function getInventoryQueryOptions<TData = GetInventoryQueryResponse, TError = unknown>(
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<TData, TError> {
  const queryKey = getInventoryQueryKey()

  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/store/inventory`,

        ...options,
      }).then((res) => res.data)
    },
  }
}

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * @link /store/inventory
 */

export function useGetInventory<TData = GetInventoryQueryResponse, TError = unknown>(
  options: {
    query?: UseQueryOptions<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getInventoryQueryKey()

  const query = useQuery<TData, TError>({
    ...getInventoryQueryOptions<TData, TError>(clientOptions),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * @link /store/order
 */

export function usePlaceOrder<TData = PlaceOrderMutationResponse, TError = PlaceOrder405, TVariables = PlaceOrderMutationRequest>(
  options: {
    mutation?: UseMutationOptions<ResponseConfig<TData>, TError, TVariables>
    client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  } = {},
): UseMutationResult<ResponseConfig<TData>, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<ResponseConfig<TData>, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url: `/store/order`,
        data,

        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}

/**
 * @description Place a new order in the store with patch
 * @summary Place an order for a pet with patch
 * @link /store/order
 */

export function usePlaceOrderPatch<TData = PlaceOrderPatchMutationResponse, TError = PlaceOrderPatch405, TVariables = PlaceOrderPatchMutationRequest>(
  options: {
    mutation?: UseMutationOptions<ResponseConfig<TData>, TError, TVariables>
    client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  } = {},
): UseMutationResult<ResponseConfig<TData>, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<ResponseConfig<TData>, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'patch',
        url: `/store/order`,
        data,

        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}

export const getOrderByIdQueryKey = (orderId: GetOrderByIdPathParams['orderId']) => [`/store/order/${orderId}`] as const

export function getOrderByIdQueryOptions<TData = GetOrderByIdQueryResponse, TError = GetOrderById400 | GetOrderById404>(
  orderId: GetOrderByIdPathParams['orderId'],
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<TData, TError> {
  const queryKey = getOrderByIdQueryKey(orderId)

  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/store/order/${orderId}`,

        ...options,
      }).then((res) => res.data)
    },
  }
}

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * @link /store/order/:orderId
 */

export function useGetOrderById<TData = GetOrderByIdQueryResponse, TError = GetOrderById400 | GetOrderById404>(
  orderId: GetOrderByIdPathParams['orderId'],
  options: {
    query?: UseQueryOptions<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getOrderByIdQueryKey(orderId)

  const query = useQuery<TData, TError>({
    ...getOrderByIdQueryOptions<TData, TError>(orderId, clientOptions),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}

/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * @link /store/order/:orderId
 */

export function useDeleteOrder<TData = DeleteOrderMutationResponse, TError = DeleteOrder400 | DeleteOrder404>(
  orderId: DeleteOrderPathParams['orderId'],
  options: {
    mutation?: UseMutationOptions<ResponseConfig<TData>, TError, void>
    client?: Partial<Parameters<typeof client<TData, TError, void>>[0]>
  } = {},
): UseMutationResult<ResponseConfig<TData>, TError, void> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<ResponseConfig<TData>, TError, void>({
    mutationFn: () => {
      return client<TData, TError, void>({
        method: 'delete',
        url: `/store/order/${orderId}`,

        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * @link /user
 */

export function useCreateUser<TData = CreateUserMutationResponse, TError = unknown, TVariables = CreateUserMutationRequest>(
  options: {
    mutation?: UseMutationOptions<ResponseConfig<TData>, TError, TVariables>
    client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  } = {},
): UseMutationResult<ResponseConfig<TData>, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<ResponseConfig<TData>, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url: `/user`,
        data,

        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * @link /user/createWithList
 */

export function useCreateUsersWithListInput<
  TData = CreateUsersWithListInputMutationResponse,
  TError = unknown,
  TVariables = CreateUsersWithListInputMutationRequest,
>(
  options: {
    mutation?: UseMutationOptions<ResponseConfig<TData>, TError, TVariables>
    client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  } = {},
): UseMutationResult<ResponseConfig<TData>, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<ResponseConfig<TData>, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url: `/user/createWithList`,
        data,

        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}

export const loginUserQueryKey = (params?: LoginUserQueryParams) => [`/user/login`, ...(params ? [params] : [])] as const

export function loginUserQueryOptions<TData = LoginUserQueryResponse, TError = LoginUser400>(
  params?: LoginUserQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<TData, TError> {
  const queryKey = loginUserQueryKey(params)

  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/user/login`,
        params,

        ...options,
      }).then((res) => res.data)
    },
  }
}

/**
 * @summary Logs user into the system
 * @link /user/login
 */

export function useLoginUser<TData = LoginUserQueryResponse, TError = LoginUser400>(
  params?: LoginUserQueryParams,
  options: {
    query?: UseQueryOptions<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? loginUserQueryKey(params)

  const query = useQuery<TData, TError>({
    ...loginUserQueryOptions<TData, TError>(params, clientOptions),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}

export const logoutUserQueryKey = () => [`/user/logout`] as const

export function logoutUserQueryOptions<TData = LogoutUserQueryResponse, TError = unknown>(
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<TData, TError> {
  const queryKey = logoutUserQueryKey()

  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/user/logout`,

        ...options,
      }).then((res) => res.data)
    },
  }
}

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */

export function useLogoutUser<TData = LogoutUserQueryResponse, TError = unknown>(
  options: {
    query?: UseQueryOptions<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? logoutUserQueryKey()

  const query = useQuery<TData, TError>({
    ...logoutUserQueryOptions<TData, TError>(clientOptions),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}

export const getUserByNameQueryKey = (username: GetUserByNamePathParams['username']) => [`/user/${username}`] as const

export function getUserByNameQueryOptions<TData = GetUserByNameQueryResponse, TError = GetUserByName400 | GetUserByName404>(
  username: GetUserByNamePathParams['username'],
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<TData, TError> {
  const queryKey = getUserByNameQueryKey(username)

  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/user/${username}`,

        ...options,
      }).then((res) => res.data)
    },
  }
}

/**
 * @summary Get user by user name
 * @link /user/:username
 */

export function useGetUserByName<TData = GetUserByNameQueryResponse, TError = GetUserByName400 | GetUserByName404>(
  username: GetUserByNamePathParams['username'],
  options: {
    query?: UseQueryOptions<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getUserByNameQueryKey(username)

  const query = useQuery<TData, TError>({
    ...getUserByNameQueryOptions<TData, TError>(username, clientOptions),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username
 */

export function useUpdateUser<TData = UpdateUserMutationResponse, TError = unknown, TVariables = UpdateUserMutationRequest>(
  username: UpdateUserPathParams['username'],
  options: {
    mutation?: UseMutationOptions<ResponseConfig<TData>, TError, TVariables>
    client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  } = {},
): UseMutationResult<ResponseConfig<TData>, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<ResponseConfig<TData>, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'put',
        url: `/user/${username}`,
        data,

        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * @link /user/:username
 */

export function useDeleteUser<TData = DeleteUserMutationResponse, TError = DeleteUser400 | DeleteUser404>(
  username: DeleteUserPathParams['username'],
  options: {
    mutation?: UseMutationOptions<ResponseConfig<TData>, TError, void>
    client?: Partial<Parameters<typeof client<TData, TError, void>>[0]>
  } = {},
): UseMutationResult<ResponseConfig<TData>, TError, void> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<ResponseConfig<TData>, TError, void>({
    mutationFn: () => {
      return client<TData, TError, void>({
        method: 'delete',
        url: `/user/${username}`,

        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}
