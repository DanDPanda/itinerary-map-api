import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();
app.use('api/*', cors());

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
		.all();

	return c.json(results);
});

app.get('/api/users/searches/:searchId', async (c) => {
	const { searchId } = c.req.param();

	const { results } = await c.itinerary_map_database.DB.prepare(
		`
		SELECT * FROM searches
		WHERE search_id = ?
	`
	)
		.bind(searchId)
		.all();

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
