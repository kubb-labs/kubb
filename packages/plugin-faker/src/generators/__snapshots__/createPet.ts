import { faker } from "@faker-js/faker";

 /**
 * @description Null response
 */
export function createPets201() {
    return unknown;
}

 /**
 * @description unexpected error
 */
export function createPetsError() {
    return error();
}

 export function createPetsMutationRequest(data: NonNullable<Partial<CreatePetsMutationRequest>> = {}) {
    return {
        ...{ "name": faker.string.alpha(), "tag": faker.string.alpha() },
        ...data
    };
}

 export function createPetsMutationResponse() {
    return unknown;
}
