import { listPets200, listPetsQueryResponse, listPetsQueryParams, createPetsMutationRequest, createPets201, createPetsMutationResponse, showPetById200, showPetByIdQueryResponse, showPetByIdPathParams } from "./showPetById";

 export const operations = { "listPets": {
        request: undefined,
        parameters: {
            path: undefined,
            query: listPetsQueryParams,
            header: undefined
        },
        responses: {
            200: listPets200,
            default: listPetsQueryResponse
        },
        errors: {}
    }, "createPets": {
        request: createPetsMutationRequest,
        parameters: {
            path: undefined,
            query: undefined,
            header: undefined
        },
        responses: {
            201: createPets201,
            default: createPetsMutationResponse
        },
        errors: {}
    }, "showPetById": {
        request: undefined,
        parameters: {
            path: showPetByIdPathParams,
            query: undefined,
            header: undefined
        },
        responses: {
            200: showPetById200,
            default: showPetByIdQueryResponse
        },
        errors: {}
    } } as const;

 export const paths = { "/pets": {
        get: operations["listPets"],
        post: operations["createPets"]
    }, "/pets/{petId}": {
        get: operations["showPetById"]
    } } as const;
