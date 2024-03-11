import client from '@kubb/swagger-client/client'
import { useMutation } from '@tanstack/react-query'
import { useInvalidationForMutation } from '../../useInvalidationForMutation'
import type { DeleteOrderMutationResponse, DeleteOrderPathParams, DeleteOrder400, DeleteOrder404 } from '../models/DeleteOrder'
import type { UseMutationOptions } from '@tanstack/react-query'

type DeleteOrderClient = typeof client<DeleteOrderMutationResponse, DeleteOrder400 | DeleteOrder404, never>
type DeleteOrder = {
  data: DeleteOrderMutationResponse
  error: DeleteOrder400 | DeleteOrder404
  request: never
  pathParams: DeleteOrderPathParams
  queryParams: never
  headerParams: never
  response: DeleteOrderMutationResponse
  client: {
    parameters: Partial<Parameters<DeleteOrderClient>[0]>
    return: Awaited<ReturnType<DeleteOrderClient>>
  }
}
/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * @link /store/order/:orderId */
export function useDeleteOrderHook(orderId: DeleteOrderPathParams['orderId'], options: {
  mutation?: UseMutationOptions<DeleteOrder['response'], DeleteOrder['error'], void>
  client?: DeleteOrder['client']['parameters']
} = {}) {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  const invalidationOnSuccess = useInvalidationForMutation('useDeleteOrderHook')
  return useMutation({
    mutationFn: async () => {
      const res = await client<DeleteOrder['data'], DeleteOrder['error'], void>({
        method: 'delete',
        url: `/store/order/${orderId}`,
        ...clientOptions,
      })
      return res.data
    },
    onSuccess: (...args) => {
      if (invalidationOnSuccess) {
        invalidationOnSuccess(...args)
      }
      if (mutationOptions?.onSuccess) {
        mutationOptions.onSuccess(...args)
      }
    },
    ...mutationOptions,
  })
}
