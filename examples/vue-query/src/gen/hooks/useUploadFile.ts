import { unref } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import client from '@kubb/swagger-client/client'
import type { KubbQueryFactory } from './types'
import type { VueMutationObserverOptions } from '@tanstack/vue-query/build/lib/useMutation'
import type { MaybeRef } from 'vue'
import type { UseMutationReturnType } from '@tanstack/vue-query'
import type { UploadFileMutationRequest, UploadFileMutationResponse, UploadFilePathParams, UploadFileQueryParams } from '../models/UploadFile'

type UploadFile = KubbQueryFactory<
  UploadFileMutationResponse,
  never,
  UploadFileMutationRequest,
  UploadFilePathParams,
  UploadFileQueryParams,
  never,
  UploadFileMutationResponse,
  {
    dataReturnType: 'full'
    type: 'mutation'
  }
> /**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage
 */

export function useUploadFile<TData = UploadFile['response'], TError = UploadFile['error']>(
  refPetId: MaybeRef<UploadFilePathParams['petId']>,
  refParams?: MaybeRef<UploadFileQueryParams>,
  options: {
    mutation?: VueMutationObserverOptions<TData, TError, UploadFile['request'], unknown>
    client?: UploadFile['client']['paramaters']
  } = {},
): UseMutationReturnType<TData, TError, UploadFile['request'], unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<TData, TError, UploadFile['request'], unknown>({
    mutationFn: (data) => {
      const petId = unref(refPetId)
      const params = unref(refParams)
      return client<UploadFile['data'], TError, UploadFile['request']>({
        method: 'post',
        url: `/pet/${petId}/uploadImage`,
        data,
        params,
        ...clientOptions,
      }).then((res) => res as TData)
    },
    ...mutationOptions,
  })
}
