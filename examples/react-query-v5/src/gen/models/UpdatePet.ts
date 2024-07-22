import type { Pet } from "./Pet";

 /**
 * @description Successful operation
*/
export type UpdatePet200 = Pet;
/**
 * @description Invalid ID supplied
*/
export type UpdatePet400 = any;
/**
 * @description Pet not found
*/
export type UpdatePet404 = any;
/**
 * @description Validation exception
*/
export type UpdatePet405 = any;
/**
 * @description Update an existent pet in the store
*/
export type UpdatePetMutationRequest = Pet;
/**
 * @description Successful operation
*/
export type UpdatePetMutationResponse = Pet;
export type UpdatePetMutation = {
    Response: UpdatePetMutationResponse;
    Request: UpdatePetMutationRequest;
    Errors: UpdatePet400 | UpdatePet404 | UpdatePet405;
};