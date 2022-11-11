import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { ErrorCodes, StatusErrors } from 'chat/shared/errors';
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

type ForgottenPasswordCredentialsFieldErrors = {
	[key in keyof ForgottenPasswordCredentials]?: string[] | undefined;
};

export default function ForgottenPassword() {
	const [fieldErrors, setFieldErrors] = React.useState<ForgottenPasswordCredentialsFieldErrors>();
	const [values, setValues] = React.useState({ email: '' });
	const [message, setMessage] = React.useState('');

	const mutation = useMutation<
		ValidatedEmailResponse,
		AxiosError<ValidatedEmailResponse, ForgottenPasswordCredentials>,
		ForgottenPasswordCredentials
	>(validateEmail, {
		onSuccess(data, variables) {
			if (!data.success) return;
			const hiddenEmail = getEncryptedEmail(variables.email);
			setMessage(`An email has been sent to ${hiddenEmail} to reset your password.`);
			setValues({ email: '' });
		},
	});

	const isValuesInvalid = !values.email;
	const hasErrors = Boolean(fieldErrors);

	function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
		const { name, value } = event.currentTarget;
		const updatedValues = { ...values, [name]: value };
		setValues(updatedValues);
		const validate = ForgottenPasswordCredentialsValidationSchema.safeParse(updatedValues);
		if (validate.success) return setFieldErrors(undefined);
		setFieldErrors(validate.error.formErrors.fieldErrors);
	}

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setFieldErrors(undefined);
		mutation.mutate(values);
	}

	return (
		<div>
			<form onSubmit={handleSubmit}>
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
							onChange={handleChange}
							value={values.email}
							name="email"
							id="email"
							placeholder="e.g user@domain.com"
							required
						/>
					</label>
					{fieldErrors?.email ? <small>{fieldErrors.email.join('. ')}</small> : null}
				</div>
				<button type="submit" disabled={isValuesInvalid || hasErrors}>
					Submit
				</button>
			</form>
		</div>
	);
}

async function validateEmail(values: ForgottenPasswordCredentials) {
	const response = await axios.post<
		ValidatedEmailResponse,
		AxiosResponse<ValidatedEmailResponse, ForgottenPasswordCredentials>,
		ForgottenPasswordCredentials
	>('http://localhost:8080/api/v1/auth/email', values);
	ValidatedEmailResponseSchema.parse(response.data);
	return response.data;
}

function getEncryptedEmail(email: string): string {
	const [username, domain] = email.split('@');
	return `****${username.slice(-3)}@${domain}`;
}
