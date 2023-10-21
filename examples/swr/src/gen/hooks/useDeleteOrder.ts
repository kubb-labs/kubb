import client from '@kubb/swagger-client/client'

import useSWRMutation from 'swr/mutation'

import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
import type { DeleteOrder400, DeleteOrderMutationResponse, DeleteOrderPathParams } from '../models/DeleteOrder'

/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * @link /store/order/:orderId
 */

export function useDeleteOrder<TData = DeleteOrderMutationResponse, TError = DeleteOrder400>(
  orderId: DeleteOrderPathParams['orderId'],
  options?: {
    mutation?: SWRMutationConfiguration<ResponseConfig<TData>, TError, string | null, never>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
    shouldFetch?: boolean
  },
): SWRMutationResponse<ResponseConfig<TData>, TError, string | null, never> {
  const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

  const url = shouldFetch ? `/store/order/${orderId}` : null
  return useSWRMutation<ResponseConfig<TData>, TError, string | null, never>(
    url,
    (url) => {
      return client<TData, TError>({
        method: 'delete',
        url,

        ...clientOptions,
      })
    },
    mutationOptions,
  )
}
