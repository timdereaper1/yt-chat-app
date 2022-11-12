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

const UserLoginCredentialsValidationSchema = z.object({
	email: z.string().email('Email is not valid'),
	password: z.string().min(6, 'Password must be more than 6 letters'),
});

type UserLoginCredentials = z.infer<typeof UserLoginCredentialsValidationSchema>;

export default function Landing() {
	const navigate = useNavigate();
	const mutation = usePost<UserLoginCredentials, AuthenticatedUser>({
		path: '/auth/login',
		validationSchema: AuthenticatedUserValidationSchema,
		onSuccess(data) {
			localforage.setItem('chat-app-auth-user-info', data);
			navigate('/chat');
		},
	});
	const form = useForm({
		validationSchema: UserLoginCredentialsValidationSchema,
		initialValues: { email: '', password: '' },
		onSubmit(values) {
			mutation.mutate(values);
		},
	});

	return (
		<div>
			<form onSubmit={form.handleSubmit}>
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
							onChange={form.handleChange}
							type="email"
							name="email"
							id="email"
							required
							value={form.values.email}
						/>
					</label>
					{form.errors?.email ? <small>{form.errors?.email.join('. ')}</small> : null}
				</div>
				<div>
					<label htmlFor="password">
						Password
						<input
							onChange={form.handleChange}
							type="password"
							name="password"
							id="password"
							required
							value={form.values.password}
						/>
					</label>
					{form.errors?.password ? (
						<small>{form.errors?.password.join('. ')}</small>
					) : null}
				</div>
				<Link to="forgotten-password">Forgotten password?</Link>
				<button disabled={form.invalid} type="submit">
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
