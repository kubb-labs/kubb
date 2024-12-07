import type { Pet } from "./Pet";

 export type GetPetByIdPathParams = {
    /**
     * @description ID of pet to return
     * @type integer, int64
    */
    petId: number;
};

 /**
 * @description successful operation
*/
export type GetPetById200 = Pet;

 /**
 * @description Invalid ID supplied
*/
export type GetPetById400 = any;

 /**
 * @description Pet not found
*/
export type GetPetById404 = any;

 export type GetPetByIdQueryResponse = GetPetById200;

 export type GetPetByIdQuery = {
    Response: GetPetById200;
    PathParams: GetPetByIdPathParams;
    Errors: GetPetById400 | GetPetById404;
};