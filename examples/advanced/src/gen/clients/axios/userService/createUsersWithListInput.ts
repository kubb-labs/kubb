import client from '../client'
import type {
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
} from '../../../models/ts/userController/CreateUsersWithListInput'

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * @link /user/createWithList
 */
export function createUsersWithListInput<TData = CreateUsersWithListInputMutationResponse, TVariables = CreateUsersWithListInputMutationRequest>(
  data: TVariables,
): Promise<TData> {
  return client<TData, TVariables>({
    method: 'post',
    url: `/user/createWithList`,

    data,
  })
}
