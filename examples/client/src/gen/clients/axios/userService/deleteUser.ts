/* eslint-disable no-alert, no-console */
import fetch from '@kubb/plugin-client/clients/fetch'
import type { DeleteUserPathParams, DeleteUserMutationResponse, DeleteUser400, DeleteUser404 } from '../../../models/ts/userController/DeleteUser.js'
import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'

function getDeleteUserUrl({ username }: { username: DeleteUserPathParams['username'] }) {
  const res = { method: 'DELETE', url: `/user/${username}` as const }
  return res
}

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * {@link /user/:username}
 */
export async function deleteUser({ username }: { username: DeleteUserPathParams['username'] }, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<DeleteUserMutationResponse, ResponseErrorConfig<DeleteUser400 | DeleteUser404>, unknown>({
    method: 'DELETE',
    url: getDeleteUserUrl({ username }).url.toString(),
    ...requestConfig,
  })
  return res.data
}
