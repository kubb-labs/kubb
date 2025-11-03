import fetch from "../../../../axios-client.ts";
import useSWRMutation from "swr/mutation";
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from "../../../../axios-client.ts";
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from "../../../models/ts/userController/UpdateUser.ts";
import { updateUser } from "../../axios/userService/updateUser.ts";

export const updateUserMutationKeySWR = () => [{ url: '/user/:username' }] as const

export type UpdateUserMutationKeySWR = ReturnType<typeof updateUserMutationKeySWR>

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * {@link /user/:username}
 */
export function useUpdateUserSWR({ username }: { username: UpdateUserPathParams["username"] }, options: 
{
  mutation?: Parameters<typeof useSWRMutation<ResponseConfig<UpdateUserMutationResponse>, ResponseErrorConfig<Error>, UpdateUserMutationKeySWR, UpdateUserMutationRequest>>[2],
  client?: Partial<RequestConfig<UpdateUserMutationRequest>> & { client?: typeof fetch },
  shouldFetch?: boolean,
}
 = {}) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = updateUserMutationKeySWR()

  return useSWRMutation<ResponseConfig<UpdateUserMutationResponse>, ResponseErrorConfig<Error>, UpdateUserMutationKeySWR | null, UpdateUserMutationRequest>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return updateUser({ username, data }, config)
    },
    mutationOptions
  )
}