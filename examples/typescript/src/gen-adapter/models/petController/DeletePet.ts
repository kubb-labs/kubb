export type DeletePetHeaderApiKey = string

export type DeletePetPathPetId = number

/**
 * @description items
 */
export type DeletePetStatus200 = ('TYPE1' | 'TYPE2' | 'TYPE3')[]

export interface DeletePetRequestConfig {
  data?: never
  pathParams: {
    petId: DeletePetPathPetId
  }
  queryParams?: never
  headerParams?: {
    api_key?: DeletePetHeaderApiKey
  }
  url: `/pet/${string}`
}

export interface DeletePetResponses {
  '200': DeletePetStatus200
}

/**
 * @description Union of all possible responses
 */
export type DeletePetResponse = DeletePetStatus200
