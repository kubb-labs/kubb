/**
 * Generated by Kubb (https://kubb.dev/).
 * Do not edit manually.
 */
import {
  listPets200,
  listPetsQueryResponse,
  listPetsQueryParams,
  createPetsMutationRequest,
  createPets201,
  createPetsMutationResponse,
  showPetById200,
  showPetByIdQueryResponse,
  showPetByIdPathParams,
  deletePet400,
  deletePetMutationResponse,
  deletePetPathParams,
  deletePetHeaderParams,
} from './showPetById'

export const operations = {
  listPets: {
    request: undefined,
    parameters: {
      path: undefined,
      query: listPetsQueryParams,
      header: undefined,
    },
    responses: {
      200: listPets200,
      default: listPetsQueryResponse,
    },
    errors: {},
  },
  createPets: {
    request: createPetsMutationRequest,
    parameters: {
      path: undefined,
      query: undefined,
      header: undefined,
    },
    responses: {
      201: createPets201,
      default: createPetsMutationResponse,
    },
    errors: {},
  },
  showPetById: {
    request: undefined,
    parameters: {
      path: showPetByIdPathParams,
      query: undefined,
      header: undefined,
    },
    responses: {
      200: showPetById200,
      default: showPetByIdQueryResponse,
    },
    errors: {},
  },
  deletePet: {
    request: undefined,
    parameters: {
      path: deletePetPathParams,
      query: undefined,
      header: deletePetHeaderParams,
    },
    responses: {
      400: deletePet400,
      default: deletePetMutationResponse,
    },
    errors: {
      400: deletePet400,
    },
  },
} as const

export const paths = {
  '/pets': {
    get: operations['listPets'],
    post: operations['createPets'],
  },
  '/pets/{petId}': {
    get: operations['showPetById'],
    delete: operations['deletePet'],
  },
} as const
