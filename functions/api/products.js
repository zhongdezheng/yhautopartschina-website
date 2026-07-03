// API: /api/products — CRUD operations
// Env bindings: DB (D1), ADMIN_TOKEN

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  // Auth check for mutations
  if (method !== 'GET') {
    const token = env.ADMIN_TOKEN || 'yhadmin2024';
    const auth = request.headers.get('Authorization');
    if (auth !== `Bearer ${token}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    switch (method) {
      case 'GET': {
        const id = url.searchParams.get('id');
        if (id) {
          const row = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
          if (!row) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
          return json(formatProduct(row));
        }
        const { results } = await env.DB.prepare('SELECT * FROM products ORDER BY updated_at DESC').all();
        return json(results.map(formatProduct));
      }

      case 'POST': {
        const body = await request.json();
        const id = body.id || slugify(body.title);
        const features = JSON.stringify(body.features || []);
        const marketFocus = JSON.stringify(body.marketFocus || []);
        const details = body.details ? JSON.stringify(body.details) : null;
        await env.DB.prepare(
          `INSERT INTO products (id, title, category, compatible, features, image, market_focus, details)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             title=excluded.title, category=excluded.category, compatible=excluded.compatible,
             features=excluded.features, image=excluded.image, market_focus=excluded.market_focus,
             details=excluded.details, updated_at=datetime('now')`
        ).bind(id, body.title, body.category, body.compatible, features, body.image || '', marketFocus, details).run();
        const row = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
        return json(formatProduct(row), 201);
      }

      case 'PUT': {
        const body = await request.json();
        const id = url.searchParams.get('id') || body.id;
        if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
        const existing = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
        if (!existing) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
        const title = body.title !== undefined ? String(body.title) : String(existing.title || '');
        const category = body.category !== undefined ? String(body.category) : String(existing.category || '');
        const compatible = body.compatible !== undefined ? String(body.compatible) : String(existing.compatible || '');
        const features = body.features !== undefined ? JSON.stringify(body.features) : String(existing.features || '[]');
        const image = body.image !== undefined ? String(body.image) : String(existing.image || '');
        const marketFocus = body.marketFocus !== undefined ? JSON.stringify(body.marketFocus) : String(existing.market_focus || '[]');
        let details = {};
        if (existing.details) {
          try { details = typeof existing.details === 'string' ? JSON.parse(existing.details) : existing.details; } catch(e) {}
        }
        if (body.series !== undefined) details.series = String(body.series);
        if (body.details !== undefined) details = body.details;
        const detailsStr = JSON.stringify(details);
        await env.DB.prepare(
          'UPDATE products SET title=?, category=?, compatible=?, features=?, image=?, market_focus=?, details=?, updated_at=datetime(?) WHERE id=?'
        ).bind(title, category, compatible, features, image, marketFocus, detailsStr, 'now', id).run();
        const row = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
        return json(formatProduct(row));
      }

      case 'DELETE': {
        const id = url.searchParams.get('id');
        if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
        return json({ deleted: id });
      }

      default:
