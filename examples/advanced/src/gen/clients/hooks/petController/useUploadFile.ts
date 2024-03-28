import { useMutation } from '@tanstack/react-query'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import client from '../../../../tanstack-query-client.ts'
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
  options: {
    mutation?: UseMutationOptions<
      UploadFile['response'],
      UploadFile['error'],
      {
        petId: UploadFilePathParams['petId']
        params?: UploadFile['queryParams']
        data?: UploadFile['request']
      }
    >
    client?: UploadFile['client']['parameters']
  } = {},
): UseMutationResult<
  UploadFile['response'],
  UploadFile['error'],
  {
    petId: UploadFilePathParams['petId']
    params?: UploadFile['queryParams']
    data?: UploadFile['request']
  }
> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<
    UploadFile['response'],
    UploadFile['error'],
    {
      petId: UploadFilePathParams['petId']
      params?: UploadFile['queryParams']
      data?: UploadFile['request']
    }
  >({
    mutationFn: async ({ petId, params, data }) => {
      const res = await client<UploadFile['data'], UploadFile['error'], UploadFile['request']>({
        method: 'post',
        url: `/pet/${petId}/uploadImage`,
        params,
        data,
        ...clientOptions,
      })
      return res
    },
    ...mutationOptions,
  })
}
