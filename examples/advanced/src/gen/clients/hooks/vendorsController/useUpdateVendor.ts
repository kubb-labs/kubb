import type { QueryClient, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { mutationOptions, useMutation } from '@tanstack/react-query'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  UpdateVendorHeaderParams,
  UpdateVendorMutationRequest,
  UpdateVendorMutationResponse,
  UpdateVendorPathParams,
} from '../../../models/ts/vendorsController/UpdateVendor.ts'
import { updateVendor } from '../../axios/VendorsService/updateVendor.ts'

export const updateVendorMutationKey = () => [{ url: '/v1/vendors/:id' }] as const

export type UpdateVendorMutationKey = ReturnType<typeof updateVendorMutationKey>

export function updateVendorMutationOptions(config: Partial<RequestConfig<UpdateVendorMutationRequest>> & { client?: typeof fetch } = {}) {
  const mutationKey = updateVendorMutationKey()
  return mutationOptions<
    ResponseConfig<UpdateVendorMutationResponse>,
    ResponseErrorConfig<Error>,
    { id: UpdateVendorPathParams['id']; data?: UpdateVendorMutationRequest; headers?: UpdateVendorHeaderParams },
    typeof mutationKey
  >({
    mutationKey,
    mutationFn: async ({ id, data, headers }) => {
      return updateVendor({ id, data, headers }, config)
    },
  })
}

/**
 * @description     Updates an existing vendor by ID.
 * @summary Update vendor
 * {@link /v1/vendors/:id}
 */
export function useUpdateVendor<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<UpdateVendorMutationResponse>,
      ResponseErrorConfig<Error>,
      { id: UpdateVendorPathParams['id']; data?: UpdateVendorMutationRequest; headers?: UpdateVendorHeaderParams },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<UpdateVendorMutationRequest>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? updateVendorMutationKey()

  const baseOptions = updateVendorMutationOptions(config) as UseMutationOptions<
    ResponseConfig<UpdateVendorMutationResponse>,
    ResponseErrorConfig<Error>,
    { id: UpdateVendorPathParams['id']; data?: UpdateVendorMutationRequest; headers?: UpdateVendorHeaderParams },
    TContext
  >

  return useMutation<
    ResponseConfig<UpdateVendorMutationResponse>,
    ResponseErrorConfig<Error>,
    { id: UpdateVendorPathParams['id']; data?: UpdateVendorMutationRequest; headers?: UpdateVendorHeaderParams },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    ResponseConfig<UpdateVendorMutationResponse>,
    ResponseErrorConfig<Error>,
    { id: UpdateVendorPathParams['id']; data?: UpdateVendorMutationRequest; headers?: UpdateVendorHeaderParams },
    TContext
  >
}
