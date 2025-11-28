import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { CreateVendorMutationRequest, CreateVendorMutationResponse, CreateVendorHeaderParams } from '../../../models/ts/vendorsController/CreateVendor.ts'
import type { SWRMutationConfiguration } from 'swr/mutation'
import { createVendor } from '../../axios/VendorsService/createVendor.ts'

export const createVendorMutationKeySWR = () => [{ url: '/v1/vendors' }] as const

export type CreateVendorMutationKeySWR = ReturnType<typeof createVendorMutationKeySWR>

/**
 * @description This endpoint creates a new vendor.
 * @summary Create vendor
 * {@link /v1/vendors}
 */
export function useCreateVendorSWR(
  headers: CreateVendorHeaderParams,
  options: {
    mutation?: SWRMutationConfiguration<
      ResponseConfig<CreateVendorMutationResponse>,
      ResponseErrorConfig<Error>,
      CreateVendorMutationKeySWR | null,
      CreateVendorMutationRequest
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig<CreateVendorMutationRequest>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = createVendorMutationKeySWR()

  return useSWRMutation<
    ResponseConfig<CreateVendorMutationResponse>,
    ResponseErrorConfig<Error>,
    CreateVendorMutationKeySWR | null,
    CreateVendorMutationRequest
  >(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return createVendor({ data, headers }, config)
    },
    mutationOptions,
  )
}
