import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  TenantsControllerCreateTenantMutationRequest,
  TenantsControllerCreateTenantMutationResponse,
} from '../../../models/ts/tenantsController/TenantsControllerCreateTenant.ts'
import type { UseMutationOptions, QueryClient } from '@tanstack/react-query'
import { tenantsControllerCreateTenant } from '../../axios/TenantsService/tenantsControllerCreateTenant.ts'
import { useMutation } from '@tanstack/react-query'

export const tenantsControllerCreateTenantMutationKey = () => [{ url: '/api/tenants' }] as const

export type TenantsControllerCreateTenantMutationKey = ReturnType<typeof tenantsControllerCreateTenantMutationKey>

/**
 * {@link /api/tenants}
 */
export function useTenantsControllerCreateTenant<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<TenantsControllerCreateTenantMutationResponse>,
      ResponseErrorConfig<Error>,
      { data: TenantsControllerCreateTenantMutationRequest },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<TenantsControllerCreateTenantMutationRequest>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? tenantsControllerCreateTenantMutationKey()

  return useMutation<
    ResponseConfig<TenantsControllerCreateTenantMutationResponse>,
    ResponseErrorConfig<Error>,
    { data: TenantsControllerCreateTenantMutationRequest },
    TContext
  >(
    {
      mutationFn: async ({ data }) => {
        return tenantsControllerCreateTenant({ data }, config)
      },
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  )
}
