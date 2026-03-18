export type UpdatePetWithFormPetId = number

export type UpdatePetWithFormName = string

export type UpdatePetWithFormStatus = string

export interface UpdatePetWithFormData {
  data?: never
  pathParams: {
    petId: UpdatePetWithFormPetId
  }
  queryParams?: {
    name?: UpdatePetWithFormName
    status?: UpdatePetWithFormStatus
  }
  headerParams?: never
  url: `/pet/${string}`
}
