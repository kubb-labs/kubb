import type { VueMutationObserverOptions } from '@tanstack/vue-query/build/lib/useMutation'
import { unref } from 'vue'
import type { MaybeRef } from 'vue'
import type { UseMutationReturnType } from '@tanstack/vue-query'
import { useMutation } from '@tanstack/vue-query'
import client from '@kubb/swagger-client/client'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { DeleteOrderMutationResponse, DeleteOrderPathParams, DeleteOrder400 } from '../models/DeleteOrder'

/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * @link /store/order/:orderId
 */

export function useDeleteOrder<TData = DeleteOrderMutationResponse, TError = DeleteOrder400>(
  refOrderId: MaybeRef<DeleteOrderPathParams['orderId']>,
  options: {
    mutation?: VueMutationObserverOptions<ResponseConfig<TData>, TError, void, unknown>
    client?: Partial<Parameters<typeof client<TData, TError, void>>[0]>
  } = {},
): UseMutationReturnType<ResponseConfig<TData>, TError, void, unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  const orderId = unref(refOrderId)
  return useMutation<ResponseConfig<TData>, TError, void, unknown>({
    mutationFn: () => {
      return client<TData, TError, void>({
        method: 'delete',
        url: `/store/order/${orderId}`,

        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}
