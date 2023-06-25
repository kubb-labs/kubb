import client from '../client'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../../../models/ts/userController/CreateUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * @link /user
 */
export function createUser<TData = CreateUserMutationResponse, TVariables = CreateUserMutationRequest>(data: TVariables): Promise<TData> {
  return client<TData, TVariables>({
    method: 'post',
    url: `/user`,

    data,
  })
}
