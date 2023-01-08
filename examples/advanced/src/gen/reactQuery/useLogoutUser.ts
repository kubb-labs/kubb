import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { parseTemplate } from 'url-template'

import type { LogoutUserResponse, LogoutUserParams } from './models/LogoutUser'

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export const useLogoutUser = (params: LogoutUserParams) => {
  return useQuery<LogoutUserResponse>({
    queryKey: ['useLogoutUser'],
    queryFn: () => {
      const template = parseTemplate('/user/logout').expand(params)
      return axios.get(template).then((res) => res.data)
    },
  })
}
