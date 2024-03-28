import type { UseMutationOptions } from '@tanstack/react-query'
import type {
  AddPetMutationRequest,
  AddPetMutationResponse,
  CreateUserMutationRequest,
  CreateUserMutationResponse,
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
  DeleteOrderMutationResponse,
  DeletePetMutationResponse,
  DeleteUserMutationResponse,
  FindPetsByStatusQueryResponse,
  FindPetsByTagsQueryResponse,
  GetInventoryQueryResponse,
  GetOrderByIdQueryResponse,
  GetPetByIdQueryResponse,
  GetUserByNameQueryResponse,
  LoginUserQueryResponse,
  LogoutUserQueryResponse,
  PlaceOrderMutationRequest,
  PlaceOrderMutationResponse,
  PlaceOrderPatchMutationRequest,
  PlaceOrderPatchMutationResponse,
  UpdatePetMutationRequest,
  UpdatePetMutationResponse,
  UpdatePetWithFormMutationResponse,
  UpdateUserMutationRequest,
  UpdateUserMutationResponse,
  UploadFileMutationRequest,
  UploadFileMutationResponse,
} from './index'

export type Invalidations = {
  useUpdatePetHook: UseMutationOptions<UpdatePetMutationResponse, unknown, UpdatePetMutationRequest>['onSuccess']
  useAddPetHook: UseMutationOptions<AddPetMutationResponse, unknown, AddPetMutationRequest>['onSuccess']
  useFindPetsByStatusHook: UseMutationOptions<FindPetsByStatusQueryResponse, unknown, void>['onSuccess']
  useFindPetsByTagsHook: UseMutationOptions<FindPetsByTagsQueryResponse, unknown, void>['onSuccess']
  useGetPetByIdHook: UseMutationOptions<GetPetByIdQueryResponse, unknown, void>['onSuccess']
  useUpdatePetWithFormHook: UseMutationOptions<UpdatePetWithFormMutationResponse, unknown, void>['onSuccess']
  useDeletePetHook: UseMutationOptions<DeletePetMutationResponse, unknown, void>['onSuccess']
  useUploadFileHook: UseMutationOptions<UploadFileMutationResponse, unknown, UploadFileMutationRequest>['onSuccess']
  useGetInventoryHook: UseMutationOptions<GetInventoryQueryResponse, unknown, void>['onSuccess']
  usePlaceOrderHook: UseMutationOptions<PlaceOrderMutationResponse, unknown, PlaceOrderMutationRequest>['onSuccess']
  usePlaceOrderPatchHook: UseMutationOptions<PlaceOrderPatchMutationResponse, unknown, PlaceOrderPatchMutationRequest>['onSuccess']
  useGetOrderByIdHook: UseMutationOptions<GetOrderByIdQueryResponse, unknown, void>['onSuccess']
  useDeleteOrderHook: UseMutationOptions<DeleteOrderMutationResponse, unknown, void>['onSuccess']
  useCreateUserHook: UseMutationOptions<CreateUserMutationResponse, unknown, CreateUserMutationRequest>['onSuccess']
  useCreateUsersWithListInputHook: UseMutationOptions<CreateUsersWithListInputMutationResponse, unknown, CreateUsersWithListInputMutationRequest>['onSuccess']
  useLoginUserHook: UseMutationOptions<LoginUserQueryResponse, unknown, void>['onSuccess']
  useLogoutUserHook: UseMutationOptions<LogoutUserQueryResponse, unknown, void>['onSuccess']
  useGetUserByNameHook: UseMutationOptions<GetUserByNameQueryResponse, unknown, void>['onSuccess']
  useUpdateUserHook: UseMutationOptions<UpdateUserMutationResponse, unknown, UpdateUserMutationRequest>['onSuccess']
  useDeleteUserHook: UseMutationOptions<DeleteUserMutationResponse, unknown, void>['onSuccess']
}
