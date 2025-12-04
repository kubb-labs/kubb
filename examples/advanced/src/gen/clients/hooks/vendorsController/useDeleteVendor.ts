import type { QueryClient, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { mutationOptions, useMutation } from '@tanstack/react-query'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { DeleteVendorMutationResponse, DeleteVendorPathParams } from '../../../models/ts/vendorsController/DeleteVendor.ts'
import { deleteVendor } from '../../axios/VendorsService/deleteVendor.ts'

export const deleteVendorMutationKey = () => [{ url: '/v1/vendors/:id' }] as const

export type DeleteVendorMutationKey = ReturnType<typeof deleteVendorMutationKey>

export function deleteVendorMutationOptions(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const mutationKey = deleteVendorMutationKey()
  return mutationOptions<ResponseConfig<DeleteVendorMutationResponse>, ResponseErrorConfig<Error>, { id: DeleteVendorPathParams['id'] }, typeof mutationKey>({
    mutationKey,
    mutationFn: async ({ id }) => {
      return deleteVendor({ id }, config)
    },
  })
}

/**
 * @description This endpoint deletes a vendor by ID.
 * @summary Delete vendor.
 * {@link /v1/vendors/:id}
 */
export function useDeleteVendor<TContext>(
  options: {
    mutation?: UseMutationOptions<ResponseConfig<DeleteVendorMutationResponse>, ResponseErrorConfig<Error>, { id: DeleteVendorPathParams['id'] }, TContext> & {
      client?: QueryClient
    }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? deleteVendorMutationKey()

  const baseOptions = deleteVendorMutationOptions(config) as UseMutationOptions<
    ResponseConfig<DeleteVendorMutationResponse>,
    ResponseErrorConfig<Error>,
    { id: DeleteVendorPathParams['id'] },
    TContext
  >

  return useMutation<ResponseConfig<DeleteVendorMutationResponse>, ResponseErrorConfig<Error>, { id: DeleteVendorPathParams['id'] }, TContext>(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<ResponseConfig<DeleteVendorMutationResponse>, ResponseErrorConfig<Error>, { id: DeleteVendorPathParams['id'] }, TContext>
}
