export type showPetByIdPathParams = {
    /**
     * @description The id of the pet to retrieve
     * @type string
    */
    petId: string;
    /**
     * @description The id of the pet to retrieve
     * @type string
    */
    testId: string;
};

/**
 * @description Expected response to a valid request
*/
export type showPetById200 = pet;

/**
 * @description unexpected error
*/
export type showPetByIdError = error;

/**
 * @description Expected response to a valid request
*/
export type showPetByIdQueryResponse = pet;

export type ShowPetByIdQuery = {
    Response: showPetByIdQueryResponse;
    PathParams: showPetByIdPathParams;
};