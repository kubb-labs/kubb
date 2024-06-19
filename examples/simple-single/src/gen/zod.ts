import { z } from "zod";


export const orderSchema = z.object({ "id": z.coerce.number().optional(), "petId": z.coerce.number().optional(), "quantity": z.coerce.number().optional(), "shipDate": z.string().datetime().optional(), "status": z.enum(["placed", "approved", "delivered"]).describe("Order Status").optional(), "http_status": z.union([z.literal(200), z.literal(400), z.literal(500)]).describe("HTTP Status's and item of this").optional(), "complete": z.boolean().optional() });


export const customerSchema = z.object({ "id": z.coerce.number().optional(), "username": z.coerce.string().optional(), "address": z.array(z.lazy(() => addressSchema)).optional() });


export const addressSchema = z.object({ "street": z.coerce.string().optional(), "city": z.coerce.string().optional(), "state": z.coerce.string().optional(), "zip": z.coerce.string().optional() });


export const categorySchema = z.object({ "id": z.coerce.number().optional(), "name": z.coerce.string().optional() });


export const userSchema = z.object({ "id": z.coerce.number().optional(), "username": z.coerce.string().optional(), "firstName": z.coerce.string().optional(), "lastName": z.coerce.string().optional(), "email": z.coerce.string().optional(), "password": z.coerce.string().optional(), "phone": z.coerce.string().optional(), "userStatus": z.coerce.number().describe("User Status").optional() });


export const tagSchema = z.object({ "id": z.coerce.number().optional(), "name": z.coerce.string().optional() });


export const petSchema = z.object({ "id": z.coerce.number().optional(), "name": z.coerce.string(), "category": z.lazy(() => categorySchema).optional(), "photoUrls": z.array(z.coerce.string()), "tags": z.array(z.lazy(() => tagSchema)).optional(), "status": z.enum(["available", "pending", "sold"]).describe("pet status in the store").optional() });


export const addPetRequestSchema = z.object({ "id": z.coerce.number().optional(), "name": z.coerce.string(), "category": z.lazy(() => categorySchema).optional(), "photoUrls": z.array(z.coerce.string()), "tags": z.array(z.lazy(() => tagSchema)).optional(), "status": z.enum(["available", "pending", "sold"]).describe("pet status in the store").optional() });


export const apiResponseSchema = z.object({ "code": z.coerce.number().optional(), "type": z.coerce.string().optional(), "message": z.coerce.string().optional() });


export const petNotFoundSchema = z.object({ "code": z.coerce.number().optional(), "message": z.coerce.string().optional() });


export const userArraySchema = z.array(z.lazy(() => userSchema));

 /**
 * @description Successful operation
 */
export const updatePet200Schema = z.lazy(() => petSchema);
/**
 * @description Invalid ID supplied
 */
export const updatePet400Schema = z.any();
/**
 * @description Pet not found
 */
export const updatePet404Schema = z.any();
/**
 * @description Validation exception
 */
export const updatePet405Schema = z.any();
/**
 * @description Update an existent pet in the store
 */
export const updatePetMutationRequestSchema = z.lazy(() => petSchema);
/**
 * @description Successful operation
 */
export const updatePetMutationResponseSchema = z.lazy(() => petSchema);

 /**
 * @description Successful operation
 */
export const addPet200Schema = z.lazy(() => petSchema);
/**
 * @description Pet not found
 */
export const addPet405Schema = z.object({ "code": z.coerce.number().optional(), "message": z.coerce.string().optional() });
/**
 * @description Create a new pet in the store
 */
export const addPetMutationRequestSchema = z.lazy(() => addPetRequestSchema);
/**
 * @description Successful operation
 */
export const addPetMutationResponseSchema = z.lazy(() => petSchema);


export const findPetsByStatusQueryParamsSchema = z.object({ "status": z.enum(["available", "pending", "sold"]).default("available").describe("Status values that need to be considered for filter").optional() }).optional();
/**
 * @description successful operation
 */
export const findPetsByStatus200Schema = z.array(z.lazy(() => petSchema));
/**
 * @description Invalid status value
 */
export const findPetsByStatus400Schema = z.any();
/**
 * @description successful operation
 */
export const findPetsByStatusQueryResponseSchema = z.array(z.lazy(() => petSchema));


export const findPetsByTagsQueryParamsSchema = z.object({ "tags": z.array(z.coerce.string()).describe("Tags to filter by").optional(), "page": z.coerce.string().describe("to request with required page number or pagination").optional(), "pageSize": z.coerce.string().describe("to request with required page size").optional() }).optional();
/**
 * @description successful operation
 */
export const findPetsByTags200Schema = z.array(z.lazy(() => petSchema));
/**
 * @description Invalid tag value
 */
export const findPetsByTags400Schema = z.any();
/**
 * @description successful operation
 */
export const findPetsByTagsQueryResponseSchema = z.array(z.lazy(() => petSchema));


export const getPetByIdPathParamsSchema = z.object({ "petId": z.coerce.number().describe("ID of pet to return") });
/**
 * @description successful operation
 */
export const getPetById200Schema = z.lazy(() => petSchema);
/**
 * @description Invalid ID supplied
 */
export const getPetById400Schema = z.any();
/**
 * @description Pet not found
 */
export const getPetById404Schema = z.any();
/**
 * @description successful operation
 */
export const getPetByIdQueryResponseSchema = z.lazy(() => petSchema);


export const updatePetWithFormPathParamsSchema = z.object({ "petId": z.coerce.number().describe("ID of pet that needs to be updated") });

 export const updatePetWithFormQueryParamsSchema = z.object({ "name": z.coerce.string().describe("Name of pet that needs to be updated").optional(), "status": z.coerce.string().describe("Status of pet that needs to be updated").optional() }).optional();
/**
 * @description Invalid input
 */
export const updatePetWithForm405Schema = z.any();

 export const updatePetWithFormMutationResponseSchema = z.any();


export const deletePetPathParamsSchema = z.object({ "petId": z.coerce.number().describe("Pet id to delete") });

 export const deletePetHeaderParamsSchema = z.object({ "api_key": z.coerce.string().optional() }).optional();
/**
 * @description Invalid pet value
 */
export const deletePet400Schema = z.any();

 export const deletePetMutationResponseSchema = z.any();


export const uploadFilePathParamsSchema = z.object({ "petId": z.coerce.number().describe("ID of pet to update") });

 export const uploadFileQueryParamsSchema = z.object({ "additionalMetadata": z.coerce.string().describe("Additional Metadata").optional() }).optional();
/**
 * @description successful operation
 */
export const uploadFile200Schema = z.lazy(() => apiResponseSchema);

 export const uploadFileMutationRequestSchema = z.string();
/**
 * @description successful operation
 */
export const uploadFileMutationResponseSchema = z.lazy(() => apiResponseSchema);

 /**
 * @description successful operation
 */
export const getInventory200Schema = z.object({}).catchall(z.coerce.number());
/**
 * @description successful operation
 */
export const getInventoryQueryResponseSchema = z.object({}).catchall(z.coerce.number());

 /**
 * @description successful operation
 */
export const placeOrder200Schema = z.lazy(() => orderSchema);
/**
 * @description Invalid input
 */
export const placeOrder405Schema = z.any();

 export const placeOrderMutationRequestSchema = z.lazy(() => orderSchema);
/**
 * @description successful operation
 */
export const placeOrderMutationResponseSchema = z.lazy(() => orderSchema);

 /**
 * @description successful operation
 */
export const placeOrderPatch200Schema = z.lazy(() => orderSchema);
/**
 * @description Invalid input
 */
export const placeOrderPatch405Schema = z.any();

 export const placeOrderPatchMutationRequestSchema = z.lazy(() => orderSchema);
/**
 * @description successful operation
 */
export const placeOrderPatchMutationResponseSchema = z.lazy(() => orderSchema);


export const getOrderByIdPathParamsSchema = z.object({ "orderId": z.coerce.number().describe("ID of order that needs to be fetched") });
/**
 * @description successful operation
 */
export const getOrderById200Schema = z.lazy(() => orderSchema);
/**
 * @description Invalid ID supplied
 */
export const getOrderById400Schema = z.any();
/**
 * @description Order not found
 */
export const getOrderById404Schema = z.any();
/**
 * @description successful operation
 */
export const getOrderByIdQueryResponseSchema = z.lazy(() => orderSchema);


export const deleteOrderPathParamsSchema = z.object({ "orderId": z.coerce.number().describe("ID of the order that needs to be deleted") });
/**
 * @description Invalid ID supplied
 */
export const deleteOrder400Schema = z.any();
/**
 * @description Order not found
 */
export const deleteOrder404Schema = z.any();

 export const deleteOrderMutationResponseSchema = z.any();

 /**
 * @description successful operation
 */
export const createUserErrorSchema = z.lazy(() => userSchema);
/**
 * @description Created user object
 */
export const createUserMutationRequestSchema = z.lazy(() => userSchema);

 export const createUserMutationResponseSchema = z.any();

 /**
 * @description Successful operation
 */
export const createUsersWithListInput200Schema = z.lazy(() => userSchema);
/**
 * @description successful operation
 */
export const createUsersWithListInputErrorSchema = z.any();

 export const createUsersWithListInputMutationRequestSchema = z.array(z.lazy(() => userSchema));
/**
 * @description Successful operation
 */
export const createUsersWithListInputMutationResponseSchema = z.lazy(() => userSchema);


export const loginUserQueryParamsSchema = z.object({ "username": z.coerce.string().describe("The user name for login").optional(), "password": z.coerce.string().describe("The password for login in clear text").optional() }).optional();
/**
 * @description successful operation
 */
export const loginUser200Schema = z.coerce.string();
/**
 * @description Invalid username/password supplied
 */
export const loginUser400Schema = z.any();
/**
 * @description successful operation
 */
export const loginUserQueryResponseSchema = z.coerce.string();

 /**
 * @description successful operation
 */
export const logoutUserErrorSchema = z.any();

 export const logoutUserQueryResponseSchema = z.any();


export const getUserByNamePathParamsSchema = z.object({ "username": z.coerce.string().describe("The name that needs to be fetched. Use user1 for testing. ") });
/**
 * @description successful operation
 */
export const getUserByName200Schema = z.lazy(() => userSchema);
/**
 * @description Invalid username supplied
 */
export const getUserByName400Schema = z.any();
/**
 * @description User not found
 */
export const getUserByName404Schema = z.any();
/**
 * @description successful operation
 */
export const getUserByNameQueryResponseSchema = z.lazy(() => userSchema);


export const updateUserPathParamsSchema = z.object({ "username": z.coerce.string().describe("name that need to be deleted") });
/**
 * @description successful operation
 */
export const updateUserErrorSchema = z.any();
/**
 * @description Update an existent user in the store
 */
export const updateUserMutationRequestSchema = z.lazy(() => userSchema);

 export const updateUserMutationResponseSchema = z.any();


export const deleteUserPathParamsSchema = z.object({ "username": z.coerce.string().describe("The name that needs to be deleted") });
/**
 * @description Invalid username supplied
 */
export const deleteUser400Schema = z.any();
/**
 * @description User not found
 */
export const deleteUser404Schema = z.any();

 export const deleteUserMutationResponseSchema = z.any();