import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  PartsControllerDownloadPartMutationRequest,
  PartsControllerDownloadPartMutationResponse,
  PartsControllerDownloadPartPathParams,
} from '../../../models/ts/partsController/PartsControllerDownloadPart.ts'
import { partsControllerDownloadPart } from '../../axios/PartsService/partsControllerDownloadPart.ts'

export const partsControllerDownloadPartMutationKeySWR = () => [{ url: '/api/parts/:urn/download' }] as const

export type PartsControllerDownloadPartMutationKeySWR = ReturnType<typeof partsControllerDownloadPartMutationKeySWR>

/**
 * {@link /api/parts/:urn/download}
 */
export function usePartsControllerDownloadPartSWR(
  { urn }: { urn: PartsControllerDownloadPartPathParams['urn'] },
  options: {
    mutation?: Parameters<
      typeof useSWRMutation<
        ResponseConfig<PartsControllerDownloadPartMutationResponse>,
        ResponseErrorConfig<Error>,
        PartsControllerDownloadPartMutationKeySWR,
        PartsControllerDownloadPartMutationRequest
      >
    >[2]
    client?: Partial<RequestConfig<PartsControllerDownloadPartMutationRequest>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = partsControllerDownloadPartMutationKeySWR()

  return useSWRMutation<
    ResponseConfig<PartsControllerDownloadPartMutationResponse>,
    ResponseErrorConfig<Error>,
    PartsControllerDownloadPartMutationKeySWR | null,
    PartsControllerDownloadPartMutationRequest
  >(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return partsControllerDownloadPart({ urn, data }, config)
    },
    mutationOptions,
  )
}
