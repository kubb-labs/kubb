import client from "@kubb/plugin-client/client";
import type { AddPetMutationRequest, AddPetMutationResponse, AddPet405 } from "../models/AddPet";
import type { RequestConfig } from "@kubb/plugin-client/client";
import type { MutationObserverOptions } from "@tanstack/vue-query";
import type { MaybeRef } from "vue";
import { useMutation } from "@tanstack/vue-query";

 export const addPetMutationKey = () => [{ "url": "/pet" }] as const;

 export type AddPetMutationKey = ReturnType<typeof addPetMutationKey>;

 /**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet
 */
async function addPet(data: AddPetMutationRequest, config: Partial<RequestConfig<AddPetMutationRequest>> = {}) {
    const res = await client<AddPetMutationResponse, AddPet405, AddPetMutationRequest>({ method: "POST", url: `/pet`, baseURL: "https://petstore3.swagger.io/api/v3", data, ...config });
    return res.data;
}

 /**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet
 */
export function useAddPet(options: {
    mutation?: MutationObserverOptions<AddPetMutationResponse, AddPet405, {
        data: MaybeRef<AddPetMutationRequest>;
    }>;
    client?: Partial<RequestConfig<AddPetMutationRequest>>;
} = {}) {
    const { mutation: mutationOptions, client: config = {} } = options ?? {};
    const mutationKey = mutationOptions?.mutationKey ?? addPetMutationKey();
    return useMutation<AddPetMutationResponse, AddPet405, {
        data: AddPetMutationRequest;
    }>({
        mutationFn: async ({ data }) => {
            return addPet(data, config);
        },
        mutationKey,
        ...mutationOptions
    });
}