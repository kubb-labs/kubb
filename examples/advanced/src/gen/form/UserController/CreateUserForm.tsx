import { useForm } from 'react-hook-form'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../../models/ts/userController/CreateUser'

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * @link /user
 */

type FieldValues = CreateUserMutationRequest

type Props = {
  onSubmit?: (data: FieldValues) => Promise<CreateUserMutationResponse> | void
}

export function CreateUserForm(props: Props): React.ReactNode {
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
         * @description Created user object
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
