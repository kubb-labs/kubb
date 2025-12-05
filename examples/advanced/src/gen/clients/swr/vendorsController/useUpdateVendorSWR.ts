import type { SWRMutationConfiguration } from 'swr/mutation'
import useSWRMutation from 'swr/mutation'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  UpdateVendorHeaderParams,
  UpdateVendorMutationRequest,
  UpdateVendorMutationResponse,
  UpdateVendorPathParams,
} from '../../../models/ts/vendorsController/UpdateVendor.ts'
import { updateVendor } from '../../axios/VendorsService/updateVendor.ts'

export const updateVendorMutationKeySWR = () => [{ url: '/v1/vendors/:id' }] as const

export type UpdateVendorMutationKeySWR = ReturnType<typeof updateVendorMutationKeySWR>

/**
 * @description     Updates an existing vendor by ID.
 * @summary Update vendor
 * {@link /v1/vendors/:id}
 */
export function useUpdateVendorSWR(
  { id }: { id: UpdateVendorPathParams['id'] },
  headers?: UpdateVendorHeaderParams,
  options: {
    mutation?: SWRMutationConfiguration<
      ResponseConfig<UpdateVendorMutationResponse>,
      ResponseErrorConfig<Error>,
      UpdateVendorMutationKeySWR | null,
      UpdateVendorMutationRequest
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig<UpdateVendorMutationRequest>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = updateVendorMutationKeySWR()

  return useSWRMutation<
    ResponseConfig<UpdateVendorMutationResponse>,
    ResponseErrorConfig<Error>,
    UpdateVendorMutationKeySWR | null,
    UpdateVendorMutationRequest
  >(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return updateVendor({ id, data, headers }, config)
    },
    mutationOptions,
  )
}
