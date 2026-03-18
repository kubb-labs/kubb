export type DeletePetApiKey = string

export type DeletePetPetId = number

/**
 * @description items
 */
export type DeletePet200 = ('TYPE1' | 'TYPE2' | 'TYPE3')[]

export interface DeletePetData {
  data?: never
  pathParams: {
    petId: DeletePetPetId
  }
  queryParams?: never
  headerParams?: {
    api_key?: DeletePetApiKey
  }
  url: `/pet/${string}`
}

export interface DeletePetResponses {
  '200': DeletePet200
}

export type DeletePetResponse = DeletePet200
