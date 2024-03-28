import useSWRMutation from 'swr/mutation'
import client from '../../../../swr-client.ts'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
import type {
  UploadFileMutationRequest,
  UploadFileMutationResponse,
  UploadFilePathParams,
  UploadFileQueryParams,
} from '../../../models/ts/petController/UploadFile'

type UploadFileClient = typeof client<UploadFileMutationResponse, never, UploadFileMutationRequest>
type UploadFile = {
  data: UploadFileMutationResponse
  error: never
  request: UploadFileMutationRequest
  pathParams: UploadFilePathParams
  queryParams: UploadFileQueryParams
  headerParams: never
  response: Awaited<ReturnType<UploadFileClient>>
  client: {
    parameters: Partial<Parameters<UploadFileClient>[0]>
    return: Awaited<ReturnType<UploadFileClient>>
  }
}
/**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage
 */
export function useUploadFile(
  petId: UploadFilePathParams['petId'],
  params?: UploadFile['queryParams'],
  options?: {
    mutation?: SWRMutationConfiguration<UploadFile['response'], UploadFile['error']>
    client?: UploadFile['client']['parameters']
    shouldFetch?: boolean
  },
): SWRMutationResponse<UploadFile['response'], UploadFile['error']> {
  const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/pet/${petId}/uploadImage` as const
  return useSWRMutation<UploadFile['response'], UploadFile['error'], [typeof url, typeof params] | null>(
    shouldFetch ? [url, params] : null,
    async (_url, { arg: data }) => {
      const res = await client<UploadFile['data'], UploadFile['error'], UploadFile['request']>({
        method: 'post',
        url,
        params,
        data,
        ...clientOptions,
      })
      return res
    },
    mutationOptions,
  )
}
