export type DeletePetPathParams = {
  /**
   * @description Pet id to delete
   * @type integer, int64
   */
  petId: number
}

export type DeletePetHeaderParams = {
  /**
   * @type string | undefined
   */
  api_key?: string
}

export const deletePet200Enum = {
  TYPE1: 'TYPE1',
  TYPE2: 'TYPE2',
  TYPE3: 'TYPE3',
} as const

export type DeletePet200Enum = (typeof deletePet200Enum)[keyof typeof deletePet200Enum]

/**
 * @description items
 */
export type DeletePet200 = DeletePet200Enum[]

/**
 * @description Invalid pet value
 */
export type DeletePet400 = any

export type DeletePetMutationResponse = DeletePet200

export type DeletePetMutation = {
  Response: DeletePet200
  PathParams: DeletePetPathParams
  HeaderParams: DeletePetHeaderParams
  Errors: DeletePet400
}
