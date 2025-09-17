import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  PartsControllerDownloadPartMutationRequest,
  PartsControllerDownloadPartMutationResponse,
  PartsControllerDownloadPartPathParams,
} from '../../../models/ts/partsController/PartsControllerDownloadPart.ts'
import type { UseMutationOptions, QueryClient } from '@tanstack/react-query'
import { partsControllerDownloadPart } from '../../axios/PartsService/partsControllerDownloadPart.ts'
import { useMutation } from '@tanstack/react-query'

export const partsControllerDownloadPartMutationKey = () => [{ url: '/api/parts/:urn/download' }] as const

export type PartsControllerDownloadPartMutationKey = ReturnType<typeof partsControllerDownloadPartMutationKey>

/**
 * {@link /api/parts/:urn/download}
 */
export function usePartsControllerDownloadPart<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<PartsControllerDownloadPartMutationResponse>,
      ResponseErrorConfig<Error>,
      { urn: PartsControllerDownloadPartPathParams['urn']; data: PartsControllerDownloadPartMutationRequest },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<PartsControllerDownloadPartMutationRequest>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? partsControllerDownloadPartMutationKey()

  return useMutation<
    ResponseConfig<PartsControllerDownloadPartMutationResponse>,
    ResponseErrorConfig<Error>,
    { urn: PartsControllerDownloadPartPathParams['urn']; data: PartsControllerDownloadPartMutationRequest },
    TContext
  >(
    {
      mutationFn: async ({ urn, data }) => {
        return partsControllerDownloadPart({ urn, data }, config)
      },
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  )
}
