import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { decode } from 'hono/jwt';

const app = new Hono();
app.use('/*', cors());
app.use('/*', async (c, next) => {
	if (!c.req.header('authorization') || !c.req.header('authorization').startsWith('Bearer ')) {
		return c.json({ error: 'Invalid Authorization' }, 401);
	}

	const jwt = decode(c.req.header('authorization').split(' ')[1]);

	if (!jwt || !jwt.payload || !jwt.payload.email) {
		return c.json({ error: 'Invalid Token' }, 401);
	}

	console.log('jwt :>> ', await c.env.itinerary_map_database.prepare('select * from users').run());
	const results = await c.env.itinerary_map_database
		.prepare(
			`
		SELECT * FROM users where email = ?
	`
		)
		.bind(jwt.payload.email)
		.run();

	console.log('results :>> ', results);

	await next();
});

app.get('/api/users/:userId/searches', async (c) => {
	const { userId } = c.req.param();

	const { results } = await c.itinerary_map_database.DB.prepare(
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

app.get('/api/hello_world', async (c) => {
	// if (!c.req.header('authorization') || !c.req.header('authorization').startsWith('Bearer ')) {
	// 	return c.json({ error: 'Invalid Authorization' }, 401);
	// }

	// const a = decode(c.req.header('authorization').split(' ')[1]);
	// console.log('a :>> ', a);
	// console.log('c.req.headers :>> ', c.req.header('authorization'));
	return c.json('hello world');
});

app.get('/api/searches/:searchId', async (c) => {
	const { searchId } = c.req.param();

	const { results } = await c.itinerary_map_database.DB.prepare(
		`
		SELECT * FROM searches
		WHERE search_id = ?
	`
	)
		.bind(searchId)
		.run();

	return c.json(results);
});

app.post('/api/searches', (c) => {
	const { user_id, search_result } = c.req.param();

	if (!user_id || !search_result) {
		return c.json({ error: 'Missing required fields' });
	}

	const { success } = c.itinerary_map_database.DB.prepare(
		`
		INSERT INTO searches (user_id, search_result)
		VALUES (?, ?)
	`
	)
		.bind(user_id, search_result)
		.run();

	if (success) {
		c.status(201);
		return c.json({ message: 'Search saved successfully' });
	} else {
		c.status(500);
		return c.json({ error: 'Failed to save search' });
	}
});

export default app;
