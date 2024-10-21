import { faker } from "@faker-js/faker";

 /**
 * @description Null response
 */
export function createPets201() {
    return undefined;
}

 /**
 * @description unexpected error
 */
export function createPetsError() {
    return error();
}

 export function createPetsMutationRequest(data?: Partial<CreatePetsMutationRequest>) {
    return {
        ...{ "name": faker.string.alpha(), "tag": faker.string.alpha() },
        ...data || {}
    };
}

 export function createPetsMutationResponse(data?: Partial<CreatePetsMutationResponse>) {
    return faker.helpers.arrayElement<any>([createPets201()]) || data;
}
