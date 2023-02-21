import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

import type { LogoutUserResponse } from '../models/ts/LogoutUser'

/**
 * @summary Logs out current logged in user session
 * @link /user/logout
 */
export const useLogoutUser = () => {
  return useQuery<LogoutUserResponse>({
    queryKey: ['useLogoutUser'],
    queryFn: () => {
      return axios.get('/user/logout').then((res) => res.data)
    },
  })
}
