/* eslint-disable no-alert, no-console */
import client from '@kubb/plugin-client/clients/axios'
import type { DeleteUserMutationResponse, DeleteUserPathParams, DeleteUser400, DeleteUser404 } from '../../../models/ts/userController/DeleteUser.js'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'

function getDeleteUserUrl({ username }: { username: DeleteUserPathParams['username'] }) {
  return `/user/${username}` as const
}

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * {@link /user/:username}
 */
export async function deleteUser(
  { username }: { username: DeleteUserPathParams['username'] },
  config: Partial<RequestConfig> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<DeleteUserMutationResponse, ResponseErrorConfig<DeleteUser400 | DeleteUser404>, unknown>({
    method: 'DELETE',
    url: getDeleteUserUrl({ username }).toString(),
    ...requestConfig,
  })
  return res.data
}
