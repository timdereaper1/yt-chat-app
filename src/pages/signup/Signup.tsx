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

const UserSignUpCredentialsValidationSchema = z
	.object({
		username: z.string().min(6, 'Username should not be less than 6 letters'),
		email: z.string().email(),
		password: z.string().min(6, 'Password must be more than 6 letters'),
		confirmPassword: z.string().min(6, 'Password must be more than 6 letters'),
	})
	.superRefine(({ confirmPassword, password }, ctx) => {
		if (confirmPassword !== password)
			ctx.addIssue({
				code: 'custom',
				path: ['confirmPassword'],
				message: 'Passwords do not match',
			});
	});

type UserSignUpCredentials = z.infer<typeof UserSignUpCredentialsValidationSchema>;

type UserSignUpCredentialsFieldErrors = {
	[key in keyof UserSignUpCredentials]?: string[] | undefined;
};

export default function Signup() {
	const [fieldErrors, setFieldErrors] = React.useState<UserSignUpCredentialsFieldErrors>();
	const [credentials, setCredentials] = React.useState<UserSignUpCredentials>({
		confirmPassword: '',
		email: '',
		password: '',
		username: '',
	});
	const navigate = useNavigate();

	const mutation = useMutation<
		AuthenticatedUser,
		AxiosError<AuthenticatedUser, UserSignUpCredentials>,
		UserSignUpCredentials
	>(registerNewUserCredentials, {
		onSuccess(data, variables, context) {
			localforage.setItem('chat-app-auth-user-info', data);
			navigate('/chat');
		},
	});

	const { confirmPassword, email, password, username } = credentials;
	const isCredentialsInvalid = !confirmPassword || !email || !password || !username;
	const hasErrors = Boolean(fieldErrors);

	function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
		const { name, value } = event.currentTarget;
		const userCredentials = { ...credentials, [name]: value };
		setCredentials(userCredentials);
		const validate = UserSignUpCredentialsValidationSchema.safeParse(userCredentials);
		if (validate.success) return setFieldErrors(undefined);
		setFieldErrors(validate.error.formErrors.fieldErrors);
	}

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		mutation.mutate(credentials);
	}

	return (
		<div>
			<form onSubmit={handleSubmit}>
				<p>Enter your credentials to create an account</p>
				{mutation.isError && mutation.error ? (
					<p>
						{mutation.error.response?.status
							? StatusErrors[mutation.error.response.status] ??
							  StatusErrors[ErrorCodes.UNKNOWN]
							: 'Sorry an unknown errored whilst signing up. Please contact the developers at timdereaper1@gmail.com.'}
					</p>
				) : null}
				<div>
					<label htmlFor="username">
						Username
						<input
							type="text"
							name="username"
							id="username"
							required
							onChange={handleChange}
							value={credentials.username}
						/>
					</label>
					{fieldErrors?.username && credentials.username ? (
						<small>{fieldErrors.username.join('. ')}</small>
					) : null}
				</div>
				<div>
					<label htmlFor="email">
						Email
						<input
							type="email"
							required
							onChange={handleChange}
							value={credentials.email}
							name="email"
							id="email"
						/>
					</label>
					{fieldErrors?.email && credentials.email ? (
						<small>{fieldErrors.email.join('. ')}</small>
					) : null}
				</div>
				<div>
					<label htmlFor="password">
						Password
						<input
							type="password"
							required
							onChange={handleChange}
							value={credentials.password}
							name="password"
							id="password"
						/>
					</label>
					{fieldErrors?.password && credentials.password ? (
						<small>{fieldErrors.password.join('. ')}</small>
					) : null}
				</div>
				<div>
					<label htmlFor="confirmPassword">
						Confirm Password
						<input
							type="password"
							required
							onChange={handleChange}
							value={credentials.confirmPassword}
							name="confirmPassword"
							id="confirmPassword"
						/>
					</label>
					{fieldErrors?.confirmPassword && credentials.confirmPassword ? (
						<small>{fieldErrors.confirmPassword.join('. ')}</small>
					) : null}
				</div>
				<div>
					<button type="submit" disabled={isCredentialsInvalid || hasErrors}>
						Sign Up
					</button>
				</div>
			</form>
			<footer>
				<p>
					Already have an account?
					<Link to="/">Log In</Link>
				</p>
			</footer>
		</div>
	);
}

async function registerNewUserCredentials(credentials: UserSignUpCredentials) {
	const response = await axios.post<
		AuthenticatedUser,
		AxiosResponse<AuthenticatedUser, UserSignUpCredentials>,
		UserSignUpCredentials
	>('http://localhost:8080/api/v1/auth/signup', credentials);
	AuthenticatedUserValidationSchema.parse(response.data);
	return response.data;
}
