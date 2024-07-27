export const createPets = rest.post('*/pets', function handler(req, res, ctx) {
  return res(ctx.json(CreatePetsMutationResponse()))
})
