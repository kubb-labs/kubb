import client from '../../../client'

import type { CreateUsersWithListInputRequest, CreateUsersWithListInputResponse } from '../../models/ts/userController/CreateUsersWithListInput'

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * @link /user/createWithList
 */
export function createUsersWithListInput<TData = CreateUsersWithListInputResponse, TVariables = CreateUsersWithListInputRequest>(data: TVariables) {
  return client<TData, TVariables>({
    method: 'post',
    url: `/user/createWithList`,
    data,
  })
}
