import client from "@kubb/plugin-client/client";
import type { UpdatePetWithFormMutationResponse, UpdatePetWithFormPathParams, UpdatePetWithFormQueryParams, UpdatePetWithForm405 } from "../models/UpdatePetWithForm.ts";
import type { RequestConfig } from "@kubb/plugin-client/client";
import type { MutationObserverOptions, MutationKey } from "@tanstack/vue-query";
import type { MaybeRef } from "vue";
import { useMutation } from "@tanstack/vue-query";

 export const updatePetWithFormMutationKey = () => [{ "url": "/pet/{petId}" }] as const;

 export type UpdatePetWithFormMutationKey = ReturnType<typeof updatePetWithFormMutationKey>;

 /**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
async function updatePetWithForm(petId: UpdatePetWithFormPathParams["petId"], params?: UpdatePetWithFormQueryParams, config: Partial<RequestConfig> = {}) {
    const res = await client<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, unknown>({ method: "POST", url: `/pet/${petId}`, baseURL: "https://petstore3.swagger.io/api/v3", params, ...config });
    return res.data;
}

 /**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function useUpdatePetWithForm(options: {
    mutation?: MutationObserverOptions<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, {
        petId: MaybeRef<UpdatePetWithFormPathParams["petId"]>;
        params?: MaybeRef<UpdatePetWithFormQueryParams>;
    }>;
    client?: Partial<RequestConfig>;
} = {}) {
    const { mutation: mutationOptions, client: config = {} } = options ?? {};
    const mutationKey = mutationOptions?.mutationKey ?? updatePetWithFormMutationKey();
    return useMutation<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, {
        petId: UpdatePetWithFormPathParams["petId"];
        params?: UpdatePetWithFormQueryParams;
    }>({
        mutationFn: async ({ petId, params }) => {
            return updatePetWithForm(petId, params, config);
        },
        mutationKey,
        ...mutationOptions
    });
}