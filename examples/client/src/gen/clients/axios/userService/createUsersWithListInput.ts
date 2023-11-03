import client from '../../../client'
import type { ResponseConfig } from '../../../client'
import type {
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
} from '../../../models/ts/userController/CreateUsersWithListInput'

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * @link /user/createWithList
 */
export async function createUsersWithListInput(
  data?: CreateUsersWithListInputMutationRequest,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<CreateUsersWithListInputMutationResponse>['data']> {
  const { data: resData } = await client<CreateUsersWithListInputMutationResponse, CreateUsersWithListInputMutationRequest>({
    method: 'post',
    url: `/user/createWithList`,
    data,
    ...options,
  })
  return resData
}
