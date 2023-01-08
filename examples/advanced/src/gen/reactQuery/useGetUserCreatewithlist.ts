import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { parseTemplate } from 'url-template'

import type { GetUserCreatewithlistResponse, GetUserCreatewithlistParams } from './models/GetUserCreatewithlist'

/**
 * @link /user/createWithList
 */
export const useGetUserCreatewithlist = (params: GetUserCreatewithlistParams) => {
  return useQuery<GetUserCreatewithlistResponse>({
    queryKey: ['useGetUserCreatewithlist'],
    queryFn: () => {
      const template = parseTemplate('/user/createWithList').expand(params)
      return axios.get(template).then((res) => res.data)
    },
  })
}
