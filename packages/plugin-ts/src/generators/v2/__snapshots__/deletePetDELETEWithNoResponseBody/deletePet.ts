export type DeletePetPathPetId = string

export type DeletePetRequestConfig = {
  data?: never
  pathParams: {
    petId: deletePetPathPetId
  }
  queryParams?: never
  headerParams?: never
  url: `/pets/${string}`
}
