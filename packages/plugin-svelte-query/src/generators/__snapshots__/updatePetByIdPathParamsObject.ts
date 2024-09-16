import client from "@kubb/plugin-client/client";
import type { RequestConfig } from "@kubb/plugin-client/client";
import type { CreateMutationOptions } from "@tanstack/svelte-query";
import { createMutation } from "@tanstack/svelte-query";

 /**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
async function updatePetWithForm({ petId }: {
    petId: UpdatePetWithFormPathParams["petId"];
}, data?: UpdatePetWithFormMutationRequest, params?: UpdatePetWithFormQueryParams, config: Partial<RequestConfig<UpdatePetWithFormMutationRequest>> = {}) {
    const res = await client<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, UpdatePetWithFormMutationRequest>({ method: "post", url: `/pet/${petId}`, params, data, ...config });
    return updatePetWithFormMutationResponse.parse(res.data);
}

 /**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function updatePetWithFormQuery(options: {
    mutation?: CreateMutationOptions<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, {
        petId: UpdatePetWithFormPathParams["petId"];
        data?: UpdatePetWithFormMutationRequest;
        params?: UpdatePetWithFormQueryParams;
    }>;
    client?: Partial<RequestConfig<UpdatePetWithFormMutationRequest>>;
} = {}) {
    const { mutation: mutationOptions, client: config = {} } = options ?? {};
    return createMutation({
        mutationFn: async ({ petId, data, params }: {
            petId: UpdatePetWithFormPathParams["petId"];
            data?: UpdatePetWithFormMutationRequest;
            params?: UpdatePetWithFormQueryParams;
        }) => {
            return updatePetWithForm({ petId }, data, params, config);
        },
        ...mutationOptions
    });
}
