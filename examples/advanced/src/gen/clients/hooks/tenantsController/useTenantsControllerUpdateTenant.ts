import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  TenantsControllerUpdateTenantMutationRequest,
  TenantsControllerUpdateTenantMutationResponse,
  TenantsControllerUpdateTenantPathParams,
} from '../../../models/ts/tenantsController/TenantsControllerUpdateTenant.ts'
import type { UseMutationOptions, QueryClient } from '@tanstack/react-query'
import { tenantsControllerUpdateTenant } from '../../axios/TenantsService/tenantsControllerUpdateTenant.ts'
import { useMutation } from '@tanstack/react-query'

export const tenantsControllerUpdateTenantMutationKey = () => [{ url: '/api/tenants/:id' }] as const

export type TenantsControllerUpdateTenantMutationKey = ReturnType<typeof tenantsControllerUpdateTenantMutationKey>

/**
 * {@link /api/tenants/:id}
 */
export function useTenantsControllerUpdateTenant<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<TenantsControllerUpdateTenantMutationResponse>,
      ResponseErrorConfig<Error>,
      { id: TenantsControllerUpdateTenantPathParams['id']; data: TenantsControllerUpdateTenantMutationRequest },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<TenantsControllerUpdateTenantMutationRequest>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? tenantsControllerUpdateTenantMutationKey()

  return useMutation<
    ResponseConfig<TenantsControllerUpdateTenantMutationResponse>,
    ResponseErrorConfig<Error>,
    { id: TenantsControllerUpdateTenantPathParams['id']; data: TenantsControllerUpdateTenantMutationRequest },
    TContext
  >(
    {
      mutationFn: async ({ id, data }) => {
        return tenantsControllerUpdateTenant({ id, data }, config)
      },
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  )
}
