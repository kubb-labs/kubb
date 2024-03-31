export const operations = {
  showPetById: {
    request: undefined,
    parameters: {
      path: ShowPetByIdPathParams,
      query: undefined,
      header: undefined,
    },
    responses: {
      200: ShowPetByIdQueryResponse,
    },
  },
} as const
export const paths = {
  '/pets/{pet_id}': {
    get: operations['showPetById'],
  },
} as const
