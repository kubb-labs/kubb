import { faker } from "@faker-js/faker";

 export function showPetByIdPathParams(data?: Partial<ShowPetByIdPathParams>) {
    return {
        ...{ "petId": faker.string.alpha(), "testId": faker.string.alpha() },
        ...data || {}
    };
}

 /**
 * @description Expected response to a valid request
 */
export function showPetById200() {
    return pet();
}

 /**
 * @description unexpected error
 */
export function showPetByIdError() {
    return error();
}

 export function showPetByIdQueryResponse(data?: Partial<ShowPetByIdQueryResponse>) {
    return faker.helpers.arrayElement<any>([showPetById200()]) || data;
}
