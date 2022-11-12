import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import localforage from 'localforage';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { PropsWithChildren } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeAll, MockedFunction, test, vi } from 'vitest';
import Signup from '../signup/Signup';
import Landing from './Landing';

vi.mock('localforage');

const mockGetItem = localforage.getItem as MockedFunction<typeof localforage.getItem>;

function wrapper({ children }: PropsWithChildren<unknown>) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return (
		<MemoryRouter initialEntries={['/']}>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</MemoryRouter>
	);
}

function setup() {
	render(<Landing />, { wrapper });
}

function Chat() {
	return <div>Chat Page</div>;
}

const server = setupServer();

beforeAll(() => {
	server.listen();
});

test('should have input field for email', () => {
	setup();
	expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
});

test('should have input field for password', () => {
	setup();
	expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
});

test('should have button to submit user credentials', () => {
	setup();
	expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
});

test('should disable submission when there are no user credentials', () => {
	setup();
	expect(screen.getByRole('button', { name: /login/i })).toBeDisabled();
});

test('should enable submission when user credentials is available', async () => {
	setup();
	await userEvent.type(screen.getByLabelText(/Email/i), 'johndoe@gmail.com');
	await userEvent.type(screen.getByLabelText(/Password/i), 'jso392');
	expect(screen.getByRole('button', { name: /login/i })).not.toBeDisabled();
});

test('should show invalid email when user enters an invalid email', async () => {
	setup();
	await userEvent.type(screen.getByLabelText(/Email/i), 'johndoecom');
	await userEvent.type(screen.getByLabelText(/Password/i), 'jso392');
	expect(screen.getByText('Email is not valid')).toBeInTheDocument();
	expect(screen.getByRole('button', { name: /login/i })).toBeDisabled();
});

test('should show minimum password length when user entered password does not exceed it', async () => {
	setup();
	await userEvent.type(screen.getByLabelText(/Email/i), 'johndoe@gmail.com');
	await userEvent.type(screen.getByLabelText(/Password/i), 'jso');
	expect(screen.getByText('Password must be more than 6 letters')).toBeInTheDocument();
	expect(screen.getByRole('button', { name: /login/i })).toBeDisabled();
});

test('should have a forgotten password link', () => {
	setup();
	expect(screen.getByRole('link', { name: /forgotten password/i })).toBeInTheDocument();
});

test('should have sign up link', () => {
	setup();
	expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
});

test('should move user to sign up page when sign up link is clicked', async () => {
	render(
		<Routes>
			<Route path="/" element={<Landing />} />
			<Route path="/signup" element={<Signup />} />
		</Routes>,
		{ wrapper }
	);

	userEvent.click(screen.getByRole('link', { name: /sign up/i }));
	await screen.findByText('Enter your credentials to create an account');
});

test('should show error when user credentials does not match login credentials', async () => {
	server.use(
		rest.post('http://localhost:8080/api/v1/auth/login', (req, res, ctx) => {
			return res(ctx.status(401));
		})
	);
	setup();
	await userEvent.type(screen.getByLabelText(/Email/i), 'johndoe@gmail.com');
	await userEvent.type(screen.getByLabelText(/Password/i), 'jso392');

	await userEvent.click(screen.getByRole('button', { name: /login/i }));

	expect(screen.getByText('Invalid login credentials')).toBeInTheDocument();
});

test('should alert user of error from the server if server failed', async () => {
	server.use(
		rest.post('http://localhost:8080/api/v1/auth/login', (req, res, ctx) => {
			return res(ctx.status(500));
		})
	);
	setup();
	await userEvent.type(screen.getByLabelText(/Email/i), 'johndoe@gmail.com');
	await userEvent.type(screen.getByLabelText(/Password/i), 'jso392');

	await userEvent.click(screen.getByRole('button', { name: /login/i }));

	expect(
		screen.getByText(
			'Sorry an error occurred on the server. Please stay calm, we are resolving it'
		)
	).toBeInTheDocument();
});

test('should alert user when there is a failure in validation', async () => {
	server.use(
		rest.post('http://localhost:8080/api/v1/auth/login', (req, res, ctx) => {
			return res(ctx.status(403));
		})
	);
	setup();
	await userEvent.type(screen.getByLabelText(/Email/i), 'johndoe@gmail.com');
	await userEvent.type(screen.getByLabelText(/Password/i), 'jso392');

	await userEvent.click(screen.getByRole('button', { name: /login/i }));

	expect(screen.getByText('Sorry an error occurred, please try again.')).toBeInTheDocument();
});

test('should show unknown error if the server returns an incorrect data', async () => {
	server.use(
		rest.post('http://localhost:8080/api/v1/auth/login', (req, res, ctx) => {
			return res(ctx.json({}));
		})
	);
	setup();
	await userEvent.type(screen.getByLabelText(/Email/i), 'johndoe@gmail.com');
	await userEvent.type(screen.getByLabelText(/Password/i), 'jso392');

	await userEvent.click(screen.getByRole('button', { name: /login/i }));

	expect(
		screen.getByText(
			'Sorry an unknown errored whilst logging in. Please contact the developers at timdereaper1@gmail.com.'
		)
	).toBeInTheDocument();
});

test('should navigate user to chat page when login is successful', async () => {
	server.use(
		rest.post('http://localhost:8080/api/v1/auth/login', (req, res, ctx) => {
			return res(
				ctx.json({
					username: 'johndoe',
					token: 'ios0wew04nsl9823sfd9',
					email: 'johndoe@gmail.com',
				})
			);
		})
	);
	render(
		<Routes>
			<Route element={<Landing />} path="/" />
			<Route element={<Chat />} path="chat" />
		</Routes>,
		{ wrapper }
	);

	await userEvent.type(screen.getByLabelText(/Email/i), 'johndoe@gmail.com');
	await userEvent.type(screen.getByLabelText(/Password/i), 'jso392');

	await userEvent.click(screen.getByRole('button', { name: /login/i }));
	await screen.findByText('Chat Page');
	expect(localforage.setItem).toHaveBeenCalledWith('chat-app-auth-user-info', {
		username: 'johndoe',
		token: 'ios0wew04nsl9823sfd9',
		email: 'johndoe@gmail.com',
	});
});

test('should navigate user to chat page when they already have an account', async () => {
	mockGetItem.mockResolvedValueOnce({
		username: 'johndoe',
		token: 'ios0wew04nsl9823sfd9',
		email: 'johndoe@gmail.com',
	});
	render(
		<Routes>
			<Route element={<Landing />} path="/" />
			<Route element={<Chat />} path="chat" />
		</Routes>,
		{ wrapper }
	);
	expect(mockGetItem).toHaveBeenCalledWith('chat-app-auth-user-info');
	await screen.findByText('Chat Page');
});

afterAll(() => {
	server.close();
});
