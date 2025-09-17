import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  TenantsControllerUpdateTenantMutationRequest,
  TenantsControllerUpdateTenantMutationResponse,
  TenantsControllerUpdateTenantPathParams,
} from '../../../models/ts/tenantsController/TenantsControllerUpdateTenant.ts'
import { tenantsControllerUpdateTenant } from '../../axios/TenantsService/tenantsControllerUpdateTenant.ts'

export const tenantsControllerUpdateTenantMutationKeySWR = () => [{ url: '/api/tenants/:id' }] as const

export type TenantsControllerUpdateTenantMutationKeySWR = ReturnType<typeof tenantsControllerUpdateTenantMutationKeySWR>

/**
 * {@link /api/tenants/:id}
 */
export function useTenantsControllerUpdateTenantSWR(
  { id }: { id: TenantsControllerUpdateTenantPathParams['id'] },
  options: {
    mutation?: Parameters<
      typeof useSWRMutation<
        ResponseConfig<TenantsControllerUpdateTenantMutationResponse>,
        ResponseErrorConfig<Error>,
        TenantsControllerUpdateTenantMutationKeySWR,
        TenantsControllerUpdateTenantMutationRequest
      >
    >[2]
    client?: Partial<RequestConfig<TenantsControllerUpdateTenantMutationRequest>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = tenantsControllerUpdateTenantMutationKeySWR()

  return useSWRMutation<
    ResponseConfig<TenantsControllerUpdateTenantMutationResponse>,
    ResponseErrorConfig<Error>,
    TenantsControllerUpdateTenantMutationKeySWR | null,
    TenantsControllerUpdateTenantMutationRequest
  >(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return tenantsControllerUpdateTenant({ id, data }, config)
    },
    mutationOptions,
  )
}
