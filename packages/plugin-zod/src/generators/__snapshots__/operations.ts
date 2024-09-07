export const operations = {
  listPets: {
    request: undefined,
    parameters: {
      path: undefined,
      query: showPetById,
      header: undefined,
    },
    responses: {
      200: showPetById,
      default: showPetById,
    },
    errors: {},
  },
  createPets: {
    request: showPetById,
    parameters: {
      path: undefined,
      query: undefined,
      header: undefined,
    },
    responses: {
      201: showPetById,
      default: showPetById,
    },
    errors: {},
  },
  showPetById: {
    request: undefined,
    parameters: {
      path: showPetById,
      query: undefined,
      header: undefined,
    },
    responses: {
      200: showPetById,
      default: showPetById,
    },
    errors: {},
  },
} as const

export const paths = {
  '/pets': {
    get: operations['listPets'],
    post: operations['createPets'],
  },
  '/pets/{petId}': {
    get: operations['showPetById'],
  },
} as const
