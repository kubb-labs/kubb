import client from '@kubb/swagger-client/client'
import { useMutation } from '@tanstack/vue-query'
import { unref } from 'vue'
import type { UploadFileMutationRequest, UploadFileMutationResponse, UploadFilePathParams, UploadFileQueryParams } from '../models/UploadFile'
import type { UseMutationOptions, UseMutationReturnType } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'

type UploadFileClient = typeof client<UploadFileMutationResponse, never, UploadFileMutationRequest>
type UploadFile = {
  data: UploadFileMutationResponse
  error: never
  request: UploadFileMutationRequest
  pathParams: UploadFilePathParams
  queryParams: UploadFileQueryParams
  headerParams: never
  response: UploadFileMutationResponse
  client: {
    paramaters: Partial<Parameters<UploadFileClient>[0]>
    return: Awaited<ReturnType<UploadFileClient>>
  }
}
/**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage */
export function useUploadFile(
  refPetId: MaybeRef<UploadFilePathParams['petId']>,
  refParams?: MaybeRef<UploadFileQueryParams>,
  options: {
    mutation?: UseMutationOptions<UploadFile['response'], UploadFile['error'], UploadFile['request'], unknown>
    client?: UploadFile['client']['paramaters']
  } = {},
): UseMutationReturnType<UploadFile['response'], UploadFile['error'], UploadFile['request'], unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<UploadFile['response'], UploadFile['error'], UploadFile['request'], unknown>({
    mutationFn: async (data) => {
      const petId = unref(refPetId)
      const params = unref(refParams)
      const res = await client<UploadFile['data'], UploadFile['error'], UploadFile['request']>({
        method: 'post',
        url: `/pet/${petId}/uploadImage`,
        params,
        data,
        ...clientOptions,
      })
      return res.data
    },
    ...mutationOptions,
  })
}
