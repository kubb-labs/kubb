import { faker } from "@faker-js/faker";

 /**
 * @description Null response
 */
export function createPets201() {
    faker.seed([222]);
    return unknown;
}

 /**
 * @description unexpected error
 */
export function createPetsError() {
    faker.seed([222]);
    return error();
}

 export function createPetsMutationRequest(data: NonNullable<Partial<CreatePetsMutationRequest>> = {}) {
    faker.seed([222]);
    return {
        ...{ "name": faker.string.alpha(), "tag": faker.string.alpha() },
        ...data
    };
}

 export function createPetsMutationResponse() {
    faker.seed([222]);
    return unknown;
}
