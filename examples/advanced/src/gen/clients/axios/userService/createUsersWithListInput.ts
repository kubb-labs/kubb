import client from '../../../../axios-client.ts'
import type { ResponseConfig } from '../../../../axios-client.ts'
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
): Promise<ResponseConfig<CreateUsersWithListInputMutationResponse>> {
  return client<CreateUsersWithListInputMutationResponse, CreateUsersWithListInputMutationRequest>({
    method: 'post',
    url: `/user/createWithList`,
    data,
    ...options,
  })
}
