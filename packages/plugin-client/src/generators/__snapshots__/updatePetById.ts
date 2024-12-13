/* eslint-disable no-alert, no-console */
import client from "@kubb/plugin-client/clients/axios";
import type { RequestConfig } from "@kubb/plugin-client/clients/axios";

 /**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId}
 */
export async function updatePetWithForm(petId: UpdatePetWithFormPathParams["petId"], params?: UpdatePetWithFormQueryParams, config: Partial<RequestConfig> = {}) {
    const res = await client<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, unknown>({ method: "POST", url: `/pet/${petId}`, params, ...config });
    return res.data;
}
