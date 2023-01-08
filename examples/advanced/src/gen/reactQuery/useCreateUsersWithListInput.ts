import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

import type { CreateUsersWithListInputRequest, CreateUsersWithListInputResponse } from './models/CreateUsersWithListInput'

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * @link /user/createWithList
 */
export const useCreateUsersWithListInput = () => {
  return useMutation<CreateUsersWithListInputResponse, unknown, CreateUsersWithListInputRequest>({
    mutationFn: (data) => {
      return axios.post('/user/createWithList', data).then((res) => res.data)
    },
  })
}
