import { rest } from 'msw'
import {
  createCreateuserswithlistinputmutationresponse,
  createCreateuserswithlistinputmutationrequest,
} from '../../mocks/userController/createCreateuserswithlistinput'

export const createuserswithlistinputHandler = rest.post('*/user/createWithList', function handler(req, res, ctx) {
  return res(ctx.json(createCreateuserswithlistinputmutationresponse()))
})
