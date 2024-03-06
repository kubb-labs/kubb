export const showPetById = rest.get('*/pets/:petId', function handler(req, res, ctx) {
  return res(ctx.json(ShowPetByIdQueryResponse()))
})
