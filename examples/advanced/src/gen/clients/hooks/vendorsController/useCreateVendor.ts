import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { CreateVendorMutationRequest, CreateVendorMutationResponse, CreateVendorHeaderParams } from '../../../models/ts/vendorsController/CreateVendor.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { createVendor } from '../../axios/VendorsService/createVendor.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const createVendorMutationKey = () => [{ url: '/v1/vendors' }] as const

export type CreateVendorMutationKey = ReturnType<typeof createVendorMutationKey>

export function createVendorMutationOptions(config: Partial<RequestConfig<CreateVendorMutationRequest>> & { client?: typeof fetch } = {}) {
  const mutationKey = createVendorMutationKey()
  return mutationOptions<
    ResponseConfig<CreateVendorMutationResponse>,
    ResponseErrorConfig<Error>,
    { data: CreateVendorMutationRequest; headers: CreateVendorHeaderParams },
    typeof mutationKey
  >({
    mutationKey,
    mutationFn: async ({ data, headers }) => {
      return createVendor({ data, headers }, config)
    },
  })
}

/**
 * @description This endpoint creates a new vendor.
 * @summary Create vendor
 * {@link /v1/vendors}
 */
export function useCreateVendor<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<CreateVendorMutationResponse>,
      ResponseErrorConfig<Error>,
      { data: CreateVendorMutationRequest; headers: CreateVendorHeaderParams },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<CreateVendorMutationRequest>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? createVendorMutationKey()

  const baseOptions = createVendorMutationOptions(config) as UseMutationOptions<
    ResponseConfig<CreateVendorMutationResponse>,
    ResponseErrorConfig<Error>,
    { data: CreateVendorMutationRequest; headers: CreateVendorHeaderParams },
    TContext
  >

  return useMutation<
    ResponseConfig<CreateVendorMutationResponse>,
    ResponseErrorConfig<Error>,
    { data: CreateVendorMutationRequest; headers: CreateVendorHeaderParams },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    ResponseConfig<CreateVendorMutationResponse>,
    ResponseErrorConfig<Error>,
    { data: CreateVendorMutationRequest; headers: CreateVendorHeaderParams },
    TContext
  >
}
