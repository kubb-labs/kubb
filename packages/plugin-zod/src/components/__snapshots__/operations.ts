export const operations = {"get_pets-pet-id": {
            request: undefined,
    parameters: {
            path: undefined,
    query: undefined,
    header: undefined
          },
    responses: {
            200: getPetsPetIdQueryResponse,
    default: getPetsPetIdQueryResponse
          },
    errors: {
            
          }
          },
    "listPets": {
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
    errors: {
            
          }
          },
    "createPets": {
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
    errors: {
            
          }
          }} as const

export const paths = {"/pets/{pet_id}": {
            get: operations["get_pets-pet-id"]
          },
    "/pets": {
            get: operations["listPets"],
    post: operations["createPets"]
          }} as const