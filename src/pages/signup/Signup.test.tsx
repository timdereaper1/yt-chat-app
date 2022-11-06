import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import localforage from 'localforage';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { PropsWithChildren } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import { StatusErrors } from '../../shared/errors';
import Landing from '../landing/Landing';
import Signup from './Signup';

vi.mock('localforage');

const wrapper = ({ children }: PropsWithChildren<unknown>) => {
	const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	return (
		<MemoryRouter initialEntries={['/signup']}>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</MemoryRouter>
	);
};

const setup = () => render(<Signup />, { wrapper });

const Chat = () => <div>Chat Page</div>;

const server = setupServer();

beforeAll(() => {
	server.listen();
});

test('should show username input field', () => {
	setup();
	expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
});

test('should show email input field', () => {
	setup();
	expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
});

test('should show password input field', () => {
	setup();
	expect(screen.getByLabelText('Password')).toBeInTheDocument();
});

test('should show confirm password input field', () => {
	setup();
	expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
});

test('should show a submission button', () => {
	setup();
	expect(screen.getByRole('button', { name: /Sign up/i })).toBeInTheDocument();
	expect(screen.getByRole('button', { name: /Sign up/i })).toBeDisabled();
});

test('should enable button when credentials are entered', async () => {
	setup();
	await userEvent.type(screen.getByLabelText(/Username/i), 'johndoe');
	await userEvent.type(screen.getByLabelText(/Email/i), 'johndoe@gmail.com');
	await userEvent.type(screen.getByLabelText('Password'), 'jos535');
	await userEvent.type(screen.getByLabelText('Confirm Password'), 'jos535');
	expect(screen.getByRole('button', { name: /Sign up/i })).not.toBeDisabled();
});

test('should disable submission when any input has errors in it', async () => {
	setup();
	await userEvent.type(screen.getByLabelText(/Username/i), 'john');
	await userEvent.type(screen.getByLabelText(/Email/i), 'johndoe@gmail.com');
	await userEvent.type(screen.getByLabelText('Password'), 'jos535');
	await userEvent.type(screen.getByLabelText('Confirm Password'), 'jos535');
	expect(screen.getByText('Username should not be less than 6 letters')).toBeInTheDocument();
	expect(screen.getByRole('button', { name: /Sign up/i })).toBeDisabled();
});

test('should show error when passwords do not match', async () => {
	setup();
	await userEvent.type(screen.getByLabelText('Password'), 'jos53sow5');
	await userEvent.type(screen.getByLabelText('Confirm Password'), 'ssdfon535');
	expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
	expect(screen.getByRole('button', { name: /Sign up/i })).toBeDisabled();
});

test('should alert user when an error occurs during submission', async () => {
	server.use(
		rest.post('http://localhost:8080/api/v1/auth/signup', (req, res, ctx) =>
			res(ctx.status(500))
		)
	);
	setup();
	await userEvent.type(screen.getByLabelText(/Username/i), 'johndoe');
	await userEvent.type(screen.getByLabelText(/Email/i), 'johndoe@gmail.com');
	await userEvent.type(screen.getByLabelText('Password'), 'jos53sow5');
	await userEvent.type(screen.getByLabelText('Confirm Password'), 'jos53sow5');

	expect(screen.getByRole('button', { name: /Sign up/i })).not.toBeDisabled();
	userEvent.click(screen.getByRole('button', { name: /Sign up/i }));
	await screen.findByText(StatusErrors[500]);
});

test('should alert user when an invalid credential data is submitted', async () => {
	server.use(
		rest.post('http://localhost:8080/api/v1/auth/signup', (req, res, ctx) =>
			res(ctx.status(400))
		)
	);
	setup();
	await userEvent.type(screen.getByLabelText(/Username/i), 'johndoe');
	await userEvent.type(screen.getByLabelText(/Email/i), 'johndoe@gmail.com');
	await userEvent.type(screen.getByLabelText('Password'), 'jos53sow5');
	await userEvent.type(screen.getByLabelText('Confirm Password'), 'jos53sow5');

	expect(screen.getByRole('button', { name: /Sign up/i })).not.toBeDisabled();
	userEvent.click(screen.getByRole('button', { name: /Sign up/i }));
	await screen.findByText(StatusErrors[400]);
});

test('should alert the user when the server responses when invalid data', async () => {
	server.use(
		rest.post('http://localhost:8080/api/v1/auth/signup', (req, res, ctx) => res(ctx.json({})))
	);
	setup();
	await userEvent.type(screen.getByLabelText(/Username/i), 'johndoe');
	await userEvent.type(screen.getByLabelText(/Email/i), 'johndoe@gmail.com');
	await userEvent.type(screen.getByLabelText('Password'), 'jos53sow5');
	await userEvent.type(screen.getByLabelText('Confirm Password'), 'jos53sow5');

	expect(screen.getByRole('button', { name: /Sign up/i })).not.toBeDisabled();
	userEvent.click(screen.getByRole('button', { name: /Sign up/i }));
	await screen.findByText(
		'Sorry an unknown errored whilst signing up. Please contact the developers at timdereaper1@gmail.com.'
	);
});

test('should navigate user to chat page when sign up is successful', async () => {
	server.use(
		rest.post('http://localhost:8080/api/v1/auth/signup', (req, res, ctx) =>
			res(
				ctx.json({
					username: 'johndoe',
					token: 'ios0wew04nsl9823sfd9',
					email: 'johndoe@gmail.com',
				})
			)
		)
	);
	render(
		<Routes>
			<Route path="/signup" element={<Signup />} />
			<Route path="/chat" element={<Chat />} />
		</Routes>,
		{ wrapper }
	);
	await userEvent.type(screen.getByLabelText(/Username/i), 'johndoe');
	await userEvent.type(screen.getByLabelText(/Email/i), 'johndoe@gmail.com');
	await userEvent.type(screen.getByLabelText('Password'), 'jos53sow5');
	await userEvent.type(screen.getByLabelText('Confirm Password'), 'jos53sow5');

	expect(screen.getByRole('button', { name: /Sign up/i })).not.toBeDisabled();
	userEvent.click(screen.getByRole('button', { name: /Sign up/i }));
	await screen.findByText('Chat Page');
	expect(localforage.setItem).toHaveBeenCalledWith('chat-app-auth-user-info', {
		username: 'johndoe',
		token: 'ios0wew04nsl9823sfd9',
		email: 'johndoe@gmail.com',
	});
});

test('should navigate user to login page when sign in link is clicked', async () => {
	render(
		<Routes>
			<Route path="/" element={<Landing />} />
			<Route path="/signup" element={<Signup />} />
		</Routes>,
		{ wrapper }
	);
	expect(screen.getByRole('link', { name: /Log In/i })).toBeInTheDocument();
	userEvent.click(screen.getByRole('link', { name: /Log In/i }));
	await screen.findByText('Enter your account login details');
});

afterAll(() => {
	server.close();
});
