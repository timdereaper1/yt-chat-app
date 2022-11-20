import { faker } from '@faker-js/faker';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import localforage from 'localforage';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterAll, beforeAll, describe, expect, MockedFunction, test, vi } from 'vitest';

import Users from './Users';

vi.mock('localforage');

function Explore() {
	return <div>Explore Page</div>;
}

function Chat() {
	return <div>Chat Page</div>;
}

function wrapper({ children }: React.PropsWithChildren<unknown>) {
	const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	return (
		<QueryClientProvider client={client}>
			<MemoryRouter initialEntries={['/users']}>{children}</MemoryRouter>
		</QueryClientProvider>
	);
}

function renderPage() {
	render(
		<Routes>
			<Route element={<Users />} path="users" />
		</Routes>,
		{ wrapper }
	);
}

function getFakeUsers(length = 1) {
	return Array.from({ length }, () => ({
		id: faker.datatype.uuid(),
		username: faker.internet.userName(),
		image: faker.internet.avatar(),
		seen: faker.date.past().toISOString(),
	}));
}

const server = setupServer();
const mockGetItem = localforage.getItem as MockedFunction<typeof localforage.getItem>;

beforeAll(() => {
	server.listen();
});

describe('when user has no people to chat with', () => {
	test('should show text indicating to user if there are no people to chat with', async () => {
		renderPage();
		await screen.findByText(
			'It looks like you have not found anyone to chat with yet. Click on the explore button below to find people to chat with'
		);
	});

	test('should have an explore button', async () => {
		renderPage();
		await screen.findByRole('link', { name: /Explore/i });
	});

	test('should navigate user to explore page when explore button is clicked', async () => {
		render(
			<Routes>
				<Route element={<Users />} path="users" />
				<Route element={<Explore />} path="explore" />
			</Routes>,
			{ wrapper }
		);
		await screen.findByRole('link', { name: /Explore/i });
		await userEvent.click(screen.getByRole('link', { name: /Explore/i }));
		await screen.findByText('Explore Page');
	});
});

describe('when user has people to chat with', () => {
	const users = getFakeUsers(1);

	test('should show a list of users when user has people to chat with', async () => {
		mockGetItem.mockResolvedValue(users);
		renderPage();
		await screen.findByRole('list', { name: /people/i });
		expect(screen.getAllByRole('listitem')).toHaveLength(1);
	});

	test("should show each person's info", async () => {
		mockGetItem.mockResolvedValue(users);
		renderPage();
		await screen.findByRole('list', { name: /people/i });
		expect(screen.getByText(users[0].username)).toBeInTheDocument();
		expect(screen.getByRole('img')).toHaveAttribute('src', users[0].image);
		expect(screen.getByText(formatDistanceToNow(new Date(users[0].seen)))).toBeInTheDocument();
	});

	test('should navigate user to private message page when a user is clicked', async () => {
		mockGetItem.mockResolvedValue(users);
		render(
			<Routes>
				<Route element={<Users />} path="users" />
				<Route element={<Chat />} path="chat/:id" />
			</Routes>,
			{ wrapper }
		);
		await screen.findByRole('list', { name: /people/i });
		userEvent.click(screen.getByRole('listitem'));
		await screen.findByText('Chat Page');
	});
});

afterAll(() => {
	server.close();
});
