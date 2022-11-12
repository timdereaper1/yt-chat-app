import useForm from 'chat/shared/hooks/useForm';
import usePost from 'chat/shared/hooks/usePost';
import localforage from 'localforage';
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

export default function Signup() {
	const navigate = useNavigate();

	const mutation = usePost<UserSignUpCredentials, AuthenticatedUser>({
		path: '/auth/signup',
		validationSchema: AuthenticatedUserValidationSchema,
		onSuccess(data) {
			localforage.setItem('chat-app-auth-user-info', data);
			navigate('/chat');
		},
	});
	const form = useForm({
		validationSchema: UserSignUpCredentialsValidationSchema,
		initialValues: { confirmPassword: '', email: '', password: '', username: '' },
		onSubmit(values) {
			mutation.mutate(values);
		},
	});

	return (
		<div>
			<form onSubmit={form.handleSubmit}>
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
							onChange={form.handleChange}
							value={form.values.username}
						/>
					</label>
					{form.errors?.username && form.values.username ? (
						<small>{form.errors.username.join('. ')}</small>
					) : null}
				</div>
				<div>
					<label htmlFor="email">
						Email
						<input
							type="email"
							required
							onChange={form.handleChange}
							value={form.values.email}
							name="email"
							id="email"
						/>
					</label>
					{form.errors?.email && form.values.email ? (
						<small>{form.errors.email.join('. ')}</small>
					) : null}
				</div>
				<div>
					<label htmlFor="password">
						Password
						<input
							type="password"
							required
							onChange={form.handleChange}
							value={form.values.password}
							name="password"
							id="password"
						/>
					</label>
					{form.errors?.password && form.values.password ? (
						<small>{form.errors.password.join('. ')}</small>
					) : null}
				</div>
				<div>
					<label htmlFor="confirmPassword">
						Confirm Password
						<input
							type="password"
							required
							onChange={form.handleChange}
							value={form.values.confirmPassword}
							name="confirmPassword"
							id="confirmPassword"
						/>
					</label>
					{form.errors?.confirmPassword && form.values.confirmPassword ? (
						<small>{form.errors.confirmPassword.join('. ')}</small>
					) : null}
				</div>
				<div>
					<button type="submit" disabled={form.invalid}>
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
