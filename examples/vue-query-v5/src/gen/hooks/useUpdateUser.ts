import client from "@kubb/swagger-client/client";
import { useMutation } from "@tanstack/vue-query";
import { unref } from "vue";
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from "../models/UpdateUser";
import type { UseMutationOptions } from "@tanstack/vue-query";
import type { MaybeRef } from "vue";

 type UpdateUserClient = typeof client<UpdateUserMutationResponse, never, UpdateUserMutationRequest>;
type UpdateUser = {
    data: UpdateUserMutationResponse;
    error: never;
    request: UpdateUserMutationRequest;
    pathParams: UpdateUserPathParams;
    queryParams: never;
    headerParams: never;
    response: UpdateUserMutationResponse;
    client: {
        parameters: Partial<Parameters<UpdateUserClient>[0]>;
        return: Awaited<ReturnType<UpdateUserClient>>;
    };
};
/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username
 */
export function useUpdateUser(refUsername: MaybeRef<UpdateUserPathParams["username"]>, options: {
    mutation?: UseMutationOptions<UpdateUser["response"], UpdateUser["error"], UpdateUser["request"], unknown>;
    client?: UpdateUser["client"]["parameters"];
} = {}) {
    const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {};
    return useMutation({
        mutationFn: async (data) => {
            const username = unref(refUsername);
            const res = await client<UpdateUser["data"], UpdateUser["error"], UpdateUser["request"]>({
                method: "put",
                url: `/user/${username}`,
                data,
                ...clientOptions
            });
            return res.data;
        },
        ...mutationOptions
    });
}