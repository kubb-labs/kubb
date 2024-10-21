
 export type ShowPetByIdPathParams = {
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
export type ShowPetById200 = pet;

 /**
 * @description unexpected error
*/
export type ShowPetByIdError = error;

 export type ShowPetByIdQueryResponse = showPetById200;

 export type showPetByIdQuery = {
    Response: showPetById200;
    PathParams: showPetByIdPathParams;
    Errors: any;
};
