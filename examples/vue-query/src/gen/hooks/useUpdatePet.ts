import client from "@kubb/plugin-client/client";
import type { UpdatePetMutationRequest, UpdatePetMutationResponse, UpdatePet400, UpdatePet404, UpdatePet405 } from "../models/UpdatePet.ts";
import type { UseMutationOptions } from "@tanstack/vue-query";
import { useMutation } from "@tanstack/vue-query";

 type UpdatePetClient = typeof client<UpdatePetMutationResponse, UpdatePet400 | UpdatePet404 | UpdatePet405, UpdatePetMutationRequest>;

 type UpdatePet = {
    data: UpdatePetMutationResponse;
    error: UpdatePet400 | UpdatePet404 | UpdatePet405;
    request: UpdatePetMutationRequest;
    pathParams: never;
    queryParams: never;
    headerParams: never;
    response: UpdatePetMutationResponse;
    client: {
        parameters: Partial<Parameters<UpdatePetClient>[0]>;
        return: Awaited<ReturnType<UpdatePetClient>>;
    };
};

 /**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet
 */
export function useUpdatePet(options: {
    mutation?: UseMutationOptions<UpdatePet["response"], UpdatePet["error"], UpdatePet["request"], unknown>;
    client?: UpdatePet["client"]["parameters"];
} = {}) {
    const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {};
    return useMutation({
        mutationFn: async (data) => {
            const res = await client<UpdatePet["data"], UpdatePet["error"], UpdatePet["request"]>({
                method: "put",
                url: `/pet`,
                data,
                ...clientOptions
            });
            return res.data;
        },
        ...mutationOptions
    });
}