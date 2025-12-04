import type { SWRMutationConfiguration } from 'swr/mutation'
import useSWRMutation from 'swr/mutation'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { DeleteVendorMutationResponse, DeleteVendorPathParams } from '../../../models/ts/vendorsController/DeleteVendor.ts'
import { deleteVendor } from '../../axios/VendorsService/deleteVendor.ts'

export const deleteVendorMutationKeySWR = () => [{ url: '/v1/vendors/:id' }] as const

export type DeleteVendorMutationKeySWR = ReturnType<typeof deleteVendorMutationKeySWR>

/**
 * @description This endpoint deletes a vendor by ID.
 * @summary Delete vendor.
 * {@link /v1/vendors/:id}
 */
export function useDeleteVendorSWR(
  { id }: { id: DeleteVendorPathParams['id'] },
  options: {
    mutation?: SWRMutationConfiguration<ResponseConfig<DeleteVendorMutationResponse>, ResponseErrorConfig<Error>, DeleteVendorMutationKeySWR | null, never> & {
      throwOnError?: boolean
    }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = deleteVendorMutationKeySWR()

  return useSWRMutation<ResponseConfig<DeleteVendorMutationResponse>, ResponseErrorConfig<Error>, DeleteVendorMutationKeySWR | null>(
    shouldFetch ? mutationKey : null,
    async (_url) => {
      return deleteVendor({ id }, config)
    },
    mutationOptions,
  )
}
