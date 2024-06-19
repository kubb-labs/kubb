export const operations = {
  'get_pets-pet-id': {
    request: undefined,
    parameters: {
      path: undefined,
      query: undefined,
      header: undefined,
    },
    responses: {
      200: GetPetsPetIdQueryResponse,
      default: GetPetsPetIdQueryResponse,
    },
    errors: {},
  },
  listPets: {
    request: undefined,
    parameters: {
      path: undefined,
      query: ListPetsQueryParams,
      header: undefined,
    },
    responses: {
      200: ListPetsQueryResponse,
      default: ListPetsQueryResponse,
    },
    errors: {},
  },
  createPets: {
    request: CreatePetsMutationRequest,
    parameters: {
      path: undefined,
      query: undefined,
      header: undefined,
    },
    responses: {
      201: CreatePetsMutationResponse,
      default: CreatePetsMutationResponse,
    },
    errors: {},
  },
} as const
export const paths = {
  '/pets/{pet_id}': {
    get: operations['get_pets-pet-id'],
  },
  '/pets': {
    get: operations['listPets'],
    post: operations['createPets'],
  },
} as const
