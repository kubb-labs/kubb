import client from '@kubb/swagger-client/client'

import { useMutation } from '@tanstack/vue-query'
import { unref } from 'vue'

import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { MutationObserverOptions, UseMutationReturnType } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import type { UploadFileMutationRequest, UploadFileMutationResponse, UploadFilePathParams, UploadFileQueryParams } from '../models/UploadFile'

/**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage
 */

export function useUploadFile<TData = UploadFileMutationResponse, TError = unknown, TVariables = UploadFileMutationRequest>(
  refPetId: MaybeRef<UploadFilePathParams['petId']>,
  refParams?: MaybeRef<UploadFileQueryParams>,
  options: {
    mutation?: MutationObserverOptions<ResponseConfig<TData>, TError, TVariables, unknown>
    client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  } = {},
): UseMutationReturnType<ResponseConfig<TData>, TError, TVariables, unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<ResponseConfig<TData>, TError, TVariables, unknown>({
    mutationFn: (data) => {
      const petId = unref(refPetId)
      const params = unref(refParams)
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
