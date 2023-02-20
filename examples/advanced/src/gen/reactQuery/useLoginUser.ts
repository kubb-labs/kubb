import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { parseTemplate } from 'url-template'

import type { LoginUserResponse, LoginUserParams } from '../models/ts/LoginUser'

/**
 * @summary Logs user into the system
 * @link /user/login
 */
export const useLoginUser = (params: LoginUserParams) => {
  return useQuery<LoginUserResponse>({
    queryKey: ['useLoginUser'],
    queryFn: () => {
      const template = parseTemplate('/user/login').expand(params)
      return axios.get(template).then((res) => res.data)
    },
  })
}
