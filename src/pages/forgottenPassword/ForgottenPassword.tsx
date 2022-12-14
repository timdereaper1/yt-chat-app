import { ErrorCodes, StatusErrors } from 'chat/shared/errors';
import useForm from 'chat/shared/hooks/useForm';
import usePost from 'chat/shared/hooks/usePost';
import React from 'react';
import { z } from 'zod';

const ForgottenPasswordCredentialsValidationSchema = z.object({
	email: z.string().email('Email is not valid'),
});

const ValidatedEmailResponseSchema = z.object({
	success: z.boolean(),
});

type ForgottenPasswordCredentials = z.infer<typeof ForgottenPasswordCredentialsValidationSchema>;
type ValidatedEmailResponse = z.infer<typeof ValidatedEmailResponseSchema>;

export default function ForgottenPassword() {
	const [message, setMessage] = React.useState('');

	const mutation = usePost<ForgottenPasswordCredentials, ValidatedEmailResponse>({
		path: '/auth/email',
		validationSchema: ValidatedEmailResponseSchema,
		onSuccess(data, variables) {
			if (!data.success) return;
			const hiddenEmail = getEncryptedEmail(variables.email);
			setMessage(`An email has been sent to ${hiddenEmail} to reset your password.`);
		},
	});

	const form = useForm({
		validationSchema: ForgottenPasswordCredentialsValidationSchema,
		initialValues: { email: '' },
		onSubmit(values, actions) {
			mutation.mutate(values, {
				onSuccess() {
					actions.resetForm();
				},
			});
		},
	});

	return (
		<div>
			<form onSubmit={form.handleSubmit}>
				{mutation.isSuccess && message ? <p>{message}</p> : null}
				{mutation.isError && mutation.error ? (
					<p>
						{mutation.error.response?.status
							? StatusErrors[mutation.error.response.status] ??
							  StatusErrors[ErrorCodes.UNKNOWN]
							: 'Sorry an unknown errored whilst validating your email. Please contact the developers at timdereaper1@gmail.com.'}
					</p>
				) : null}
				<div>
					<label htmlFor="email">
						Email
						<input
							type="email"
							onChange={form.handleChange}
							value={form.values.email}
							name="email"
							id="email"
							placeholder="e.g user@domain.com"
							required
						/>
					</label>
					{form.errors?.email ? <small>{form.errors.email.join('. ')}</small> : null}
				</div>
				<button type="submit" disabled={form.invalid}>
					Submit
				</button>
			</form>
		</div>
	);
}

function getEncryptedEmail(email: string): string {
	const [username, domain] = email.split('@');
	return `****${username.slice(-3)}@${domain}`;
}
