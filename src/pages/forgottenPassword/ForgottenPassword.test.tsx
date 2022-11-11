import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, beforeAll, test } from 'vitest';
import ForgottenPassword from './ForgottenPassword';

const server = setupServer();

const setup = () => {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	render(
		<QueryClientProvider client={queryClient}>
			<ForgottenPassword />
		</QueryClientProvider>
	);
};

beforeAll(() => {
	server.listen();
});

test('should show email input field', () => {
	setup();
	expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
});

test('should show a submit button for email submission', () => {
	setup();
	expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument();
});

test('should disable submit button when there is no email', () => {
	setup();
	expect(screen.getByRole('button', { name: /Submit/i })).toBeDisabled();
});

test('should enable submit button when user has entered their email', async () => {
	setup();
	await userEvent.type(screen.getByLabelText(/Email/i), 'user@gmail.com');
	expect(screen.getByRole('button', { name: /Submit/i })).not.toBeDisabled();
});

test('should disable submission when email is not of the correct format', async () => {
	setup();
	await userEvent.type(screen.getByLabelText(/Email/i), 'user@gmail');
	expect(screen.getByRole('button', { name: /Submit/i })).toBeDisabled();
	expect(screen.getByText('Email is not valid')).toBeInTheDocument();
});

test('should alert user when request fails with invalid request data', async () => {
	server.use(
		rest.post('http://localhost:8080/api/v1/auth/email', (req, res, ctx) =>
			res(ctx.status(400))
		)
	);
	setup();
	await userEvent.type(screen.getByLabelText(/Email/i), 'user@gmail.com');
	userEvent.click(screen.getByRole('button', { name: /Submit/i }));
	await screen.findByText(
		'Sorry the information you sent is incorrect. Please check the data and try again.'
	);
});

test('should alert user when server returns an invalid response', async () => {
	server.use(
		rest.post('http://localhost:8080/api/v1/auth/email', (req, res, ctx) => res(ctx.json({})))
	);
	setup();
	await userEvent.type(screen.getByLabelText(/Email/i), 'user@gmail.com');
	userEvent.click(screen.getByRole('button', { name: /Submit/i }));
	await screen.findByText(
		'Sorry an unknown errored whilst validating your email. Please contact the developers at timdereaper1@gmail.com.'
	);
});

test('should alert the user to access their email to reset their password', async () => {
	server.use(
		rest.post('http://localhost:8080/api/v1/auth/email', (req, res, ctx) =>
			res(ctx.json({ success: true }))
		)
	);
	setup();
	await userEvent.type(screen.getByLabelText(/Email/i), 'user@gmail.com');
	userEvent.click(screen.getByRole('button', { name: /Submit/i }));
	await screen.findByText('An email has been sent to ****ser@gmail.com to reset your password.');
	expect(screen.getByLabelText(/Email/i)).toHaveValue('');
});

afterAll(() => {
	server.close();
});
