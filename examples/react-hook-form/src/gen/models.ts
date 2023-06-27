export const catType = {
  cat: 'cat',
} as const
export type CatType = (typeof catType)[keyof typeof catType]
export type Cat = {
  /**
   * @type integer | undefined
   */
  petsRequested?: number | undefined
  /**
   * @type string
   */
  type: CatType
}

export type Dachshund = {
  /**
   * @type integer
   */
  length: number
}

export type Error = {
  /**
   * @type integer int32
   */
  code: number
  /**
   * @type string
   */
  message: string
}

export type Labradoodle = {
  /**
   * @type integer
   */
  cuteness: number
}

export type Pets = Pet[]

export const dogType = {
  dog: 'dog',
} as const
export type DogType = (typeof dogType)[keyof typeof dogType]
export type Dog = {
  /**
   * @type integer | undefined
   */
  barksPerMinute?: number | undefined
  /**
   * @type string
   */
  type: DogType
} & (Labradoodle | Dachshund)

export const petCallingCode = {
  '+33': '+33',
  '+420': '+420',
} as const
export type PetCallingCode = (typeof petCallingCode)[keyof typeof petCallingCode]
export const petCountry = {
  "People's Republic of China": "People's Republic of China",
  Uruguay: 'Uruguay',
} as const
export type PetCountry = (typeof petCountry)[keyof typeof petCountry]
export type Pet = {
  /**
   * @type string | undefined iri-reference
   */
  '@id'?: string | undefined
  /**
   * @type integer int64
   */
  id: number
  /**
   * @type string
   */
  name: string
  /**
   * @type string | undefined
   */
  tag?: string | undefined
  /**
   * @type string | undefined email
   */
  email?: string | undefined
  /**
   * @type string | undefined
   */
  callingCode?: PetCallingCode | undefined
  /**
   * @type string | undefined
   */
  country?: PetCountry | undefined
} & (Dog | Cat)

export type ListPetsQueryParams = {
  /**
   * @type string | undefined
   */
  limit?: string | undefined
}

/**
 * @description unexpected error
 */
export type ListPetsError = Error

/**
 * @description A paged array of pets
 */
export type ListPetsQueryResponse = Pets

export type CreatePetsMutationRequest = {
  /**
   * @type string
   * @default 'Lily'
   */
  name: string
  /**
   * @type string
   */
  tag: string
}

/**
 * @description unexpected error
 */
export type CreatePetsError = Error

/**
 * @description Created Pet
 */
export type CreatePetsMutationResponse = Pet

export type ShowPetByIdPathParams = {
  /**
   * @type string
   */
  petId: string
  /**
   * @type string
   */
  testId: string
}

/**
 * @description unexpected error
 */
export type ShowPetByIdError = Error

/**
 * @description Expected response to a valid request
 */
export type ShowPetByIdQueryResponse = Pet

export type ListPetsBreedPathParams = {
  /**
   * @type string
   */
  breed: string
}

export type ListPetsBreedQueryParams = {
  /**
   * @type string | undefined
   */
  limit?: string | undefined
}

/**
 * @description unexpected error
 */
export type ListPetsBreedError = Error

/**
 * @description A paged array of pets
 */
export type ListPetsBreedQueryResponse = Pets

export type CreatePetsBreedMutationRequest = {
  /**
   * @type string
   */
  name: string
  /**
   * @type string
   */
  tag: string
  /**
   * @type boolean | undefined
   */
  isActive?: boolean | undefined
}

export type CreatePetsBreedPathParams = {
  /**
   * @type string
   */
  breed: string
}

/**
 * @description unexpected error
 */
export type CreatePetsBreedError = Error

/**
 * @description Created Pet
 */
export type CreatePetsBreedMutationResponse = Pet
