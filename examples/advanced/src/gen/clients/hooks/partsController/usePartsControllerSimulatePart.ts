import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  PartsControllerSimulatePartMutationRequest,
  PartsControllerSimulatePartMutationResponse,
  PartsControllerSimulatePartPathParams,
} from '../../../models/ts/partsController/PartsControllerSimulatePart.ts'
import type { UseMutationOptions, QueryClient } from '@tanstack/react-query'
import { partsControllerSimulatePart } from '../../axios/PartsService/partsControllerSimulatePart.ts'
import { useMutation } from '@tanstack/react-query'

export const partsControllerSimulatePartMutationKey = () => [{ url: '/api/parts/:urn/simulate' }] as const

export type PartsControllerSimulatePartMutationKey = ReturnType<typeof partsControllerSimulatePartMutationKey>

/**
 * {@link /api/parts/:urn/simulate}
 */
export function usePartsControllerSimulatePart<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<PartsControllerSimulatePartMutationResponse>,
      ResponseErrorConfig<Error>,
      { urn: PartsControllerSimulatePartPathParams['urn']; data: PartsControllerSimulatePartMutationRequest },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<PartsControllerSimulatePartMutationRequest>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? partsControllerSimulatePartMutationKey()

  return useMutation<
    ResponseConfig<PartsControllerSimulatePartMutationResponse>,
    ResponseErrorConfig<Error>,
    { urn: PartsControllerSimulatePartPathParams['urn']; data: PartsControllerSimulatePartMutationRequest },
    TContext
  >(
    {
      mutationFn: async ({ urn, data }) => {
        return partsControllerSimulatePart({ urn, data }, config)
      },
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  )
}
