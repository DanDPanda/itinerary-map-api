import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();
app.use('api/*', cors());

app.get('/api/users/:slug/searches', (c) => {
	return c.text('Hello, World!');
});

app.get('/api/users/:slug/searches/:slug', (c) => {
	return c.text('Hello, World!');
});

app.post('/api/users/:slug/searches', (c) => {
	return c.text('Hello, World!');
});
