import client from '../../../client'

import type { CreateUserRequest, CreateUserResponse } from '../../models/ts/CreateUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * @link /user
 */
export const createUser = <TData = CreateUserResponse, TVariables = CreateUserRequest>(data: TVariables) => {
  return client<TData, TVariables>({
    method: 'post',
    url: `/user`,
    data,
  })
}
