import { useForm } from 'react-hook-form'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../../models/ts/userController/UpdateUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username
 */

type FieldValues = UpdateUserMutationRequest

type Props = {
  onSubmit?: (data: FieldValues) => Promise<UpdateUserMutationResponse> | void
  username: UpdateUserPathParams['username']
}

export function UpdateUserForm(props: Props): React.ReactNode {
  const { onSubmit } = props

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FieldValues>({
    defaultValues: {
      username: undefined,
      firstName: undefined,
      lastName: undefined,
      email: undefined,
      password: undefined,
      phone: undefined,
    },
  })

  return (
    <>
      <form
        onSubmit={handleSubmit((data) => {
          onSubmit?.(data)
        })}
      >
        {/**
         * @description Update an existent user in the store
         */}

        <label>username</label>
        <input {...register('username', { required: false })} defaultValue="" />

        <label>firstName</label>
        <input {...register('firstName', { required: false })} defaultValue="" />

        <label>lastName</label>
        <input {...register('lastName', { required: false })} defaultValue="" />

        <label>email</label>
        <input {...register('email', { required: false })} defaultValue="" />

        <label>password</label>
        <input {...register('password', { required: false })} defaultValue="" />

        <label>phone</label>
        <input {...register('phone', { required: false })} defaultValue="" />

        <input type="submit" />
      </form>
    </>
  )
}
