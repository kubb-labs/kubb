import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  PartsControllerSimulatePartMutationRequest,
  PartsControllerSimulatePartMutationResponse,
  PartsControllerSimulatePartPathParams,
} from '../../../models/ts/partsController/PartsControllerSimulatePart.ts'
import { partsControllerSimulatePart } from '../../axios/PartsService/partsControllerSimulatePart.ts'

export const partsControllerSimulatePartMutationKeySWR = () => [{ url: '/api/parts/:urn/simulate' }] as const

export type PartsControllerSimulatePartMutationKeySWR = ReturnType<typeof partsControllerSimulatePartMutationKeySWR>

/**
 * {@link /api/parts/:urn/simulate}
 */
export function usePartsControllerSimulatePartSWR(
  { urn }: { urn: PartsControllerSimulatePartPathParams['urn'] },
  options: {
    mutation?: Parameters<
      typeof useSWRMutation<
        ResponseConfig<PartsControllerSimulatePartMutationResponse>,
        ResponseErrorConfig<Error>,
        PartsControllerSimulatePartMutationKeySWR,
        PartsControllerSimulatePartMutationRequest
      >
    >[2]
    client?: Partial<RequestConfig<PartsControllerSimulatePartMutationRequest>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = partsControllerSimulatePartMutationKeySWR()

  return useSWRMutation<
    ResponseConfig<PartsControllerSimulatePartMutationResponse>,
    ResponseErrorConfig<Error>,
    PartsControllerSimulatePartMutationKeySWR | null,
    PartsControllerSimulatePartMutationRequest
  >(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return partsControllerSimulatePart({ urn, data }, config)
    },
    mutationOptions,
  )
}
