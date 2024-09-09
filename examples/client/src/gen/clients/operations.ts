export const operations = {
  updatePet: {
    path: '/pet',
    method: 'put',
  },
  addPet: {
    path: '/pet',
    method: 'post',
  },
  findPetsByStatus: {
    path: '/pet/findByStatus',
    method: 'get',
  },
  findPetsByTags: {
    path: '/pet/findByTags',
    method: 'get',
  },
  getPetById: {
    path: '/pet/:petId',
    method: 'get',
  },
  updatePetWithForm: {
    path: '/pet/:petId',
    method: 'post',
  },
  deletePet: {
    path: '/pet/:petId',
    method: 'delete',
  },
  uploadFile: {
    path: '/pet/:petId/uploadImage',
    method: 'post',
  },
  createUser: {
    path: '/user',
    method: 'post',
  },
  createUsersWithListInput: {
    path: '/user/createWithList',
    method: 'post',
  },
  loginUser: {
    path: '/user/login',
    method: 'get',
  },
  logoutUser: {
    path: '/user/logout',
    method: 'get',
  },
  getUserByName: {
    path: '/user/:username',
    method: 'get',
  },
  updateUser: {
    path: '/user/:username',
    method: 'put',
  },
  deleteUser: {
    path: '/user/:username',
    method: 'delete',
  },
} as const
