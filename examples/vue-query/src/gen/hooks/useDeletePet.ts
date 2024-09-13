import client from "@kubb/plugin-client/client";
import type { DeletePetMutationResponse, DeletePetPathParams, DeletePetHeaderParams, DeletePet400 } from "../models/DeletePet.ts";
import type { UseMutationOptions } from "@tanstack/vue-query";
import type { MaybeRef } from "vue";
import { useMutation } from "@tanstack/vue-query";
import { unref } from "vue";

 type DeletePetClient = typeof client<DeletePetMutationResponse, DeletePet400, never>;

 type DeletePet = {
    data: DeletePetMutationResponse;
    error: DeletePet400;
    request: never;
    pathParams: DeletePetPathParams;
    queryParams: never;
    headerParams: DeletePetHeaderParams;
    response: DeletePetMutationResponse;
    client: {
        parameters: Partial<Parameters<DeletePetClient>[0]>;
        return: Awaited<ReturnType<DeletePetClient>>;
    };
};

 /**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/:petId
 */
export function useDeletePet(refPetId: MaybeRef<DeletePetPathParams["petId"]>, refHeaders?: MaybeRef<DeletePetHeaderParams>, options: {
    mutation?: UseMutationOptions<DeletePet["response"], DeletePet["error"], void, unknown>;
    client?: DeletePet["client"]["parameters"];
} = {}) {
    const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {};
    return useMutation({
        mutationFn: async (data) => {
            const petId = unref(refPetId);
            const headers = unref(refHeaders);
            const res = await client<DeletePet["data"], DeletePet["error"], DeletePet["request"]>({
                method: "delete",
                url: `/pet/${petId}`,
                headers: { ...headers, ...clientOptions.headers },
                ...clientOptions
            });
            return res.data;
        },
        ...mutationOptions
    });
}