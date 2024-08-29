import type client from '@kubb/plugin-client/client'
import axios from 'axios'
import type {
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
} from '../../../models/ts/userController/CreateUsersWithListInput.ts'
import type { ResponseConfig } from '@kubb/plugin-client/client'

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * @link /user/createWithList
 */
export async function createUsersWithListInput(
  data?: CreateUsersWithListInputMutationRequest,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<CreateUsersWithListInputMutationResponse>['data']> {
  return axios.post('/user/createWithList', data, options)
}
