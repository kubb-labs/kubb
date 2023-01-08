import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { parseTemplate } from 'url-template'

import type { GetUserByNameResponse, GetUserByNameParams } from './models/GetUserByName'

/**
 * @summary Get user by user name
 * @link /user/{username}
 */
export const useGetUserByName = (params: GetUserByNameParams) => {
  return useQuery<GetUserByNameResponse>({
    queryKey: ['useGetUserByName'],
    queryFn: () => {
      const template = parseTemplate('/user/{username}').expand(params)
      return axios.get(template).then((res) => res.data)
    },
  })
}
