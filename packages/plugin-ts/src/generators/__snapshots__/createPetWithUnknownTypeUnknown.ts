
 /**
 * @description Null response
*/
export type CreatePets201 = (error & {
    /**
     * @type object | undefined
    */
    name?: errorCode;
});

 /**
 * @description unexpected error
*/
export type CreatePetsError = error;

 export type CreatePetsMutationRequest = {
    /**
     * @type string
    */
    name: string;
    /**
     * @type string
    */
    tag: string;
};

 /**
 * @description Null response
*/
export type CreatePetsMutationResponse = (error & {
    /**
     * @type object | undefined
    */
    name?: errorCode;
});

 export type createPetsMutation = {
    Response: createPetsMutationResponse;
    Request: createPetsMutationRequest;
};
