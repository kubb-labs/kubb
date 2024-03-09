import type { UpdatePetMutationResponse, AddPetMutationResponse, FindPetsByStatusQueryResponse, FindPetsByTagsQueryResponse, GetPetByIdQueryResponse, UpdatePetWithFormMutationResponse, DeletePetMutationResponse, UploadFileMutationResponse, GetInventoryQueryResponse, PlaceOrderMutationResponse, PlaceOrderPatchMutationResponse, GetOrderByIdQueryResponse, DeleteOrderMutationResponse, CreateUserMutationResponse, CreateUsersWithListInputMutationResponse, LoginUserQueryResponse, LogoutUserQueryResponse, GetUserByNameQueryResponse, UpdateUserMutationResponse, DeleteUserMutationResponse } from "./index";
import type { UseMutationOptions } from "@tanstack/react-query";

 export type Invalidations = {
    "useUpdatePetHook": UseMutationOptions<UpdatePetMutationResponse, unknown, void>["onSuccess"];
    "useAddPetHook": UseMutationOptions<AddPetMutationResponse, unknown, void>["onSuccess"];
    "useFindPetsByStatusHook": UseMutationOptions<FindPetsByStatusQueryResponse, unknown, void>["onSuccess"];
    "useFindPetsByTagsHook": UseMutationOptions<FindPetsByTagsQueryResponse, unknown, void>["onSuccess"];
    "useGetPetByIdHook": UseMutationOptions<GetPetByIdQueryResponse, unknown, void>["onSuccess"];
    "useUpdatePetWithFormHook": UseMutationOptions<UpdatePetWithFormMutationResponse, unknown, void>["onSuccess"];
    "useDeletePetHook": UseMutationOptions<DeletePetMutationResponse, unknown, void>["onSuccess"];
    "useUploadFileHook": UseMutationOptions<UploadFileMutationResponse, unknown, void>["onSuccess"];
    "useGetInventoryHook": UseMutationOptions<GetInventoryQueryResponse, unknown, void>["onSuccess"];
    "usePlaceOrderHook": UseMutationOptions<PlaceOrderMutationResponse, unknown, void>["onSuccess"];
    "usePlaceOrderPatchHook": UseMutationOptions<PlaceOrderPatchMutationResponse, unknown, void>["onSuccess"];
    "useGetOrderByIdHook": UseMutationOptions<GetOrderByIdQueryResponse, unknown, void>["onSuccess"];
    "useDeleteOrderHook": UseMutationOptions<DeleteOrderMutationResponse, unknown, void>["onSuccess"];
    "useCreateUserHook": UseMutationOptions<CreateUserMutationResponse, unknown, void>["onSuccess"];
    "useCreateUsersWithListInputHook": UseMutationOptions<CreateUsersWithListInputMutationResponse, unknown, void>["onSuccess"];
    "useLoginUserHook": UseMutationOptions<LoginUserQueryResponse, unknown, void>["onSuccess"];
    "useLogoutUserHook": UseMutationOptions<LogoutUserQueryResponse, unknown, void>["onSuccess"];
    "useGetUserByNameHook": UseMutationOptions<GetUserByNameQueryResponse, unknown, void>["onSuccess"];
    "useUpdateUserHook": UseMutationOptions<UpdateUserMutationResponse, unknown, void>["onSuccess"];
    "useDeleteUserHook": UseMutationOptions<DeleteUserMutationResponse, unknown, void>["onSuccess"];
};