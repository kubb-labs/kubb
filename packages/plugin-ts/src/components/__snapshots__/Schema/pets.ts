/**
 * @description Null response
*/
export type createPets201 = any;

/**
 * @description unexpected error
*/
export type createPetsError = error;

export type createPetsMutationRequest = {
    /**
     * @type string
    */
    name: string;
    /**
     * @type string
    */
    tag: string;
};

export type createPetsMutationResponse = any;

export type CreatePetsMutation = {
    Response: createPetsMutationResponse;
    Request: createPetsMutationRequest;
};