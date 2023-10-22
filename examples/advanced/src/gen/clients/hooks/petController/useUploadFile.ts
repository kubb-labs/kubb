import { useMutation } from '@tanstack/react-query'
import client from '../../../../tanstack-query-client.ts'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import type { ResponseConfig } from '../../../../tanstack-query-client.ts'
import type {
  UploadFileMutationRequest,
  UploadFileMutationResponse,
  UploadFilePathParams,
  UploadFileQueryParams,
} from '../../../models/ts/petController/UploadFile'

/**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage
 */

export function useUploadFile<TData = UploadFileMutationResponse, TError = unknown, TVariables = UploadFileMutationRequest>(
  petId: UploadFilePathParams['petId'],
  params?: UploadFileQueryParams,
  options: {
    mutation?: UseMutationOptions<ResponseConfig<TData>, TError, TVariables>
    client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  } = {},
): UseMutationResult<ResponseConfig<TData>, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<ResponseConfig<TData>, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url: `/pet/${petId}/uploadImage`,
        data,
        params,

        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}
