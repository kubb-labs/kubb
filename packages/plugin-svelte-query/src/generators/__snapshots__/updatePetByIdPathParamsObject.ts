import client from "@kubb/plugin-client/client";
import type { RequestConfig } from "@kubb/plugin-client/client";
import type { CreateMutationOptions, CreateMutationResult, MutationKey } from "@tanstack/svelte-query";
import { createMutation } from "@tanstack/svelte-query";

 export const updatePetWithFormMutationKey = () => [{ "url": "/pet/{petId}" }] as const;

 export type UpdatePetWithFormMutationKey = ReturnType<typeof updatePetWithFormMutationKey>;

 /**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
async function updatePetWithForm({ petId }: {
    petId: UpdatePetWithFormPathParams["petId"];
}, data?: UpdatePetWithFormMutationRequest, params?: UpdatePetWithFormQueryParams, config: Partial<RequestConfig<UpdatePetWithFormMutationRequest>> = {}) {
    const res = await client<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, UpdatePetWithFormMutationRequest>({ method: "POST", url: `/pet/${petId}`, params, data, ...config });
    return updatePetWithFormMutationResponse.parse(res.data);
}

 /**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function createUpdatePetWithForm(options: {
    mutation?: CreateMutationOptions<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, {
        petId: UpdatePetWithFormPathParams["petId"];
        data?: UpdatePetWithFormMutationRequest;
        params?: UpdatePetWithFormQueryParams;
    }>;
    client?: Partial<RequestConfig<UpdatePetWithFormMutationRequest>>;
} = {}) {
    const { mutation: mutationOptions, client: config = {} } = options ?? {};
    const mutationKey = mutationOptions?.mutationKey ?? updatePetWithFormMutationKey();
    const mutation = createMutation({
        mutationFn: async ({ petId, data, params }: {
            petId: UpdatePetWithFormPathParams["petId"];
            data?: UpdatePetWithFormMutationRequest;
            params?: UpdatePetWithFormQueryParams;
        }) => {
            return updatePetWithForm({ petId }, data, params, config);
        },
        ...mutationOptions
    }) as CreateMutationResult<UpdatePetWithFormMutationResponse, UpdatePetWithForm405> & {
        mutationKey: MutationKey;
    };
    mutation.mutationKey = mutationKey as MutationKey;
    return mutation;
}
