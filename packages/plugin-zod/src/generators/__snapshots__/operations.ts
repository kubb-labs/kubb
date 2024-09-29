import { listPetsQueryResponse, listPetsQueryParams, createPetsMutationRequest, createPetsMutationResponse, showPetByIdQueryResponse, showPetByIdPathParams } from "./showPetById";

 export const operations = { "listPets": {
        request: undefined,
        parameters: {
            path: undefined,
            query: listPetsQueryParams,
            header: undefined
        },
        responses: {
            200: listPetsQueryResponse,
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
            201: createPetsMutationResponse,
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
            200: showPetByIdQueryResponse,
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
