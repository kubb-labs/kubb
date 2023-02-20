import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

import type { PostStoreInventoryRequest, PostStoreInventoryResponse } from '../models/ts/PostStoreInventory'

/**
 * @link /store/inventory
 */
export const usePostStoreInventory = () => {
  return useMutation<PostStoreInventoryResponse, unknown, PostStoreInventoryRequest>({
    mutationFn: (data) => {
      return axios.post('/store/inventory', data).then((res) => res.data)
    },
  })
}
