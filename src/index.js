import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { decode } from 'hono/jwt';

const app = new Hono();
app.use('/*', cors());
app.use('/*', async (c, next) => {
	// need to reject if it's not for the right auth
	if (!c.req.header('authorization') || !c.req.header('authorization').startsWith('Bearer ')) {
		return c.json({ error: 'Invalid Authorization' }, 401);
	}

	const jwt = decode(c.req.header('authorization').split(' ')[1]);

	if (!jwt || !jwt.payload || !jwt.payload.email) {
		return c.json({ error: 'Invalid Token' }, 401);
	}

	const result = await c.env.itinerary_map_database
		.prepare(
			`
		SELECT * FROM users where email = ?
	`
		)
		.bind(jwt.payload.email)
		.run();

	const user = result.results[0];

	if (!user) {
		const userId = crypto.randomUUID();
		const insertResult = await c.env.itinerary_map_database
			.prepare(
				`
			INSERT INTO users (user_id, email)
			VALUES (?, ?)
		`
			)
			.bind(userId, jwt.payload.email)
			.run();

		if (!insertResult.success) {
			return c.json({ error: 'Failed to create user' }, 500);
		}
		c.set('userId', userId);
	} else {
		c.set('userId', user.user_id);
	}

	await next();
});

app.get('/api/users/searches', async (c) => {
	const userId = c.get('userId');

	const { results } = await c.env.itinerary_map_database
		.prepare(
			`
		SELECT * FROM searches
		WHERE user_id = ?
		ORDER BY created_at DESC
	`
		)
		.bind(userId)
		.run();

	return c.json(results);
});

app.get('/api/searches/:searchId', async (c) => {
	const { searchId } = c.req.param();
	const userId = c.get('userId');

	const { results } = await c.env.itinerary_map_database
		.prepare(
			`
		SELECT * FROM searches
		WHERE search_id = ?
		AND user_id = ?
	`
		)
		.bind(searchId, userId)
		.run();

	const search = results[0];

	if (!search) {
		return c.json({ error: 'Search not found' }, 404);
	}

	return c.json(search);
});

app.post('/api/searches', async (c) => {
	const userId = c.get('userId');
	const { searchTopic, searchResult } = await c.req.json();

	if (!searchResult) {
		return c.json({ error: 'Missing required fields' });
	}

	const a = await c.env.itinerary_map_database
		.prepare(
			`
		INSERT INTO searches (search_id, user_id, search_topic, search_result)
		VALUES (?, ?, ?, ?)
	`
		)
		.bind(crypto.randomUUID(), userId, searchTopic, searchResult)
		.run();

	if (a.success) {
		c.status(201);
		return c.json({ message: 'Search saved successfully' });
	} else {
		c.status(500);
		return c.json({ error: 'Failed to save search' });
	}
});

export default app;
