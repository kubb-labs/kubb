import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

import type { PostStoreOrderOrderidRequest, PostStoreOrderOrderidResponse } from '../models/ts/PostStoreOrderOrderid'

/**
 * @link /store/order/{orderId}
 */
export const usePostStoreOrderOrderid = () => {
  return useMutation<PostStoreOrderOrderidResponse, unknown, PostStoreOrderOrderidRequest>({
    mutationFn: (data) => {
      return axios.post('/store/order/{orderId}', data).then((res) => res.data)
    },
  })
}
