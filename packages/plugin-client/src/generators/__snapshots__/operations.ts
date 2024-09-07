export const operations = {
  listPets: {
    path: '/pets',
    method: 'get',
  },
  createPets: {
    path: '/pets',
    method: 'post',
  },
  showPetById: {
    path: '/pets/:petId',
    method: 'get',
  },
} as const
