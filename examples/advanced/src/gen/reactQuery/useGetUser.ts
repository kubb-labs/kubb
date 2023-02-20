import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { parseTemplate } from 'url-template'

import type { GetUserResponse, GetUserParams } from '../models/ts/GetUser'

/**
 * @link /user
 */
export const useGetUser = (params: GetUserParams) => {
  return useQuery<GetUserResponse>({
    queryKey: ['useGetUser'],
    queryFn: () => {
      const template = parseTemplate('/user').expand(params)
      return axios.get(template).then((res) => res.data)
    },
  })
}
