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
        if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        const existing = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
        if (!existing) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        // Merge details if series is provided
        let details = existing.details ? (typeof existing.details === 'string' ? JSON.parse(existing.details) : existing.details) : {};
        if (body.details !== undefined) details = body.details;
        if (body.series !== undefined) details.series = body.series;
        const fields = {
          title: body.title !== undefined ? body.title : (existing.title || ''),
          category: body.category !== undefined ? body.category : (existing.category || ''),
          compatible: body.compatible !== undefined ? body.compatible : (existing.compatible || ''),
          features: body.features !== undefined ? JSON.stringify(body.features) : (existing.features || '[]'),
          image: body.image !== undefined ? body.image : (existing.image || ''),
          market_focus: body.marketFocus !== undefined ? JSON.stringify(body.marketFocus) : (existing.market_focus || '[]'),
          details: JSON.stringify(details),
        };
        await env.DB.prepare(
          `UPDATE products SET title=?, category=?, compatible=?, features=?, image=?, market_focus=?, details=?, updated_at=datetime('now') WHERE id=?`
        ).bind(fields.title, fields.category, fields.compatible, fields.features, fields.image || '', fields.market_focus, fields.details, id).run();
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
