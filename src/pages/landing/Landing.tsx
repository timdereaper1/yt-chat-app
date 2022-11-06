import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError, AxiosResponse } from 'axios';
import localforage from 'localforage';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { ErrorCodes, StatusErrors } from '../../shared/errors';
import {
	AuthenticatedUser,
	AuthenticatedUserValidationSchema,
} from '../../shared/validations/auth';

const UserLoginCredentialsValidationSchema = z.object({
	email: z.string().email('Email is not valid'),
	password: z.string().min(6, 'Password must be more than 6 letters'),
});

type UserLoginCredentials = z.infer<typeof UserLoginCredentialsValidationSchema>;

type UserLoginCredentialsFieldErrors = Partial<{
	[key in keyof UserLoginCredentials]: string[] | undefined;
}>;

export default function Landing() {
	const [credentials, setCredentials] = React.useState<UserLoginCredentials>({
		email: '',
		password: '',
	});
	const [errors, setErrors] = React.useState<UserLoginCredentialsFieldErrors>();
	const navigate = useNavigate();
	const mutation = useMutation<
		AuthenticatedUser,
		AxiosError<AuthenticatedUser, UserLoginCredentials>,
		UserLoginCredentials
	>(validateUserLoginCredentials, {
		onSuccess(data) {
			localforage.setItem('chat-app-auth-user-info', data);
			navigate('/chat');
		},
	});

	const { email, password } = credentials;

	const isCredentialsInvalid = !email && !password;
	const hasErrors = !!errors;

	function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
		const { name, value } = event.currentTarget;
		const updatedUserCredentials = { ...credentials, [name]: value };
		setCredentials(updatedUserCredentials);
		const validate = UserLoginCredentialsValidationSchema.safeParse(updatedUserCredentials);
		if (validate.success) return setErrors(undefined);
		setErrors(validate.error.formErrors.fieldErrors);
	}

	async function handleSubmission(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setErrors(undefined);
		mutation.mutate(credentials);
	}

	return (
		<div>
			<form onSubmit={handleSubmission}>
				<p>Enter your account login details</p>
				{mutation.isError && mutation.error ? (
					<p>
						{mutation.error.response?.status
							? StatusErrors[mutation.error.response.status] ??
							  StatusErrors[ErrorCodes.UNKNOWN]
							: 'Sorry an unknown errored whilst logging in. Please contact the developers at timdereaper1@gmail.com.'}
					</p>
				) : null}
				<div>
					<label htmlFor="email">
						Email
						<input
							onChange={handleInputChange}
							type="email"
							name="email"
							id="email"
							required
							value={credentials.email}
						/>
					</label>
					{errors?.email ? <small>{errors?.email.join('. ')}</small> : null}
				</div>
				<div>
					<label htmlFor="password">
						Password
						<input
							onChange={handleInputChange}
							type="password"
							name="password"
							id="password"
							required
							value={credentials.password}
						/>
					</label>
					{errors?.password ? <small>{errors?.password.join('. ')}</small> : null}
				</div>
				<Link to="forgotten-password">Forgotten password?</Link>
				<button disabled={isCredentialsInvalid || hasErrors} type="submit">
					Login
				</button>
			</form>
			<footer>
				<p>
					Don&quote;t have an account?
					<Link to="/signup">Sign up</Link>
				</p>
			</footer>
		</div>
	);
}

async function validateUserLoginCredentials(userCredentials: UserLoginCredentials) {
	const response = await axios.post<
		AuthenticatedUser,
		AxiosResponse<AuthenticatedUser, UserLoginCredentials>,
		UserLoginCredentials
	>('http://localhost:8080/api/v1/auth/login', userCredentials);
	AuthenticatedUserValidationSchema.parse(response.data);
	return response.data;
}
