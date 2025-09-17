import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  TenantsControllerCreateTenantMutationRequest,
  TenantsControllerCreateTenantMutationResponse,
} from '../../../models/ts/tenantsController/TenantsControllerCreateTenant.ts'
import { tenantsControllerCreateTenant } from '../../axios/TenantsService/tenantsControllerCreateTenant.ts'

export const tenantsControllerCreateTenantMutationKeySWR = () => [{ url: '/api/tenants' }] as const

export type TenantsControllerCreateTenantMutationKeySWR = ReturnType<typeof tenantsControllerCreateTenantMutationKeySWR>

/**
 * {@link /api/tenants}
 */
export function useTenantsControllerCreateTenantSWR(
  options: {
    mutation?: Parameters<
      typeof useSWRMutation<
        ResponseConfig<TenantsControllerCreateTenantMutationResponse>,
        ResponseErrorConfig<Error>,
        TenantsControllerCreateTenantMutationKeySWR,
        TenantsControllerCreateTenantMutationRequest
      >
    >[2]
    client?: Partial<RequestConfig<TenantsControllerCreateTenantMutationRequest>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = tenantsControllerCreateTenantMutationKeySWR()

  return useSWRMutation<
    ResponseConfig<TenantsControllerCreateTenantMutationResponse>,
    ResponseErrorConfig<Error>,
    TenantsControllerCreateTenantMutationKeySWR | null,
    TenantsControllerCreateTenantMutationRequest
  >(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return tenantsControllerCreateTenant({ data }, config)
    },
    mutationOptions,
  )
}
