/**
 * @description successful operation
 */
export function createPlaceOrder200(data?: Partial<PlaceOrder200>): PlaceOrder200 {

  return createOrder(data)
}

/**
 * @description Invalid input
 */
export function createPlaceOrder405() {

  return undefined
}

export function createPlaceOrderMutationRequest(data?: Partial<PlaceOrderMutationRequest>): PlaceOrderMutationRequest {

  return createOrder(data)
}

export function createPlaceOrderMutationResponse(data?: Partial<PlaceOrderMutationResponse>): PlaceOrderMutationResponse {

  return data || faker.helpers.arrayElement<any>([createPlaceOrder200()])
}