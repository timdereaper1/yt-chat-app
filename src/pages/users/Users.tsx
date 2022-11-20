import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import localforage from 'localforage';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';

const UserValidationSchema = z.object({
	id: z.string(),
	username: z.string(),
	image: z.string().nullable(),
	seen: z.string(),
});

const UsersValidationSchema = z.array(UserValidationSchema);

type User = z.infer<typeof UserValidationSchema>;

export default function Users() {
	const cachedUsers = useQuery(['cached-users'], async () => {
		const locallyStoredUsers = await localforage.getItem<User[]>('chat-app-user-chats');
		return locallyStoredUsers ?? null;
	});

	const navigate = useNavigate();

	function showChatWithUser(user: User) {
		return function () {
			navigate(`/chat/${user.id}`);
		};
	}

	return (
		<div>
			{cachedUsers.isLoading ? null : cachedUsers.data?.length ? (
				<ul aria-label="people">
					{cachedUsers.data.map((person) => (
						<li key={person.id} onClick={showChatWithUser(person)}>
							<img src={person.image ?? ''} alt={person.username} />
							<span>{person.username}</span>
							<small>{formatDistanceToNow(new Date(person.seen))}</small>
						</li>
					))}
				</ul>
			) : (
				<>
					<p>
						It looks like you have not found anyone to chat with yet. Click on the
						explore button below to find people to chat with
					</p>
					<Link to="/explore">Explore</Link>
				</>
			)}
		</div>
	);
}
