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
        const status = url.searchParams.get('status') || 'active';
        const { results } = await env.DB.prepare('SELECT * FROM products WHERE status = ? ORDER BY updated_at DESC').bind(status).all();
        return json(results.map(formatProduct));
      }

      case 'POST': {
        const body = await request.json();
        const id = body.id || slugify(body.title);
        const features = JSON.stringify(body.features || []);
        const marketFocus = JSON.stringify(body.marketFocus || []);
        const details = body.details ? JSON.stringify(body.details) : null;
        const series = body.series || '';
        const status = body.status || 'active';
        await env.DB.prepare(
          `INSERT INTO products (id, title, category, compatible, features, image, market_focus, details, series, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             title=excluded.title, category=excluded.category, compatible=excluded.compatible,
             features=excluded.features, image=excluded.image, market_focus=excluded.market_focus,
             details=excluded.details, series=excluded.series, status=excluded.status, updated_at=datetime('now')`
        ).bind(id, body.title, body.category, body.compatible, features, body.image || '', marketFocus, details, series, status).run();
        const row = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
        return json(formatProduct(row), 201);
      }

      case 'PUT': {
        const body = await request.json();
        const id = url.searchParams.get('id') || body.id;
        if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        // Partial update: only update provided fields
        const existing = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
        if (!existing) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        const fields = {
          title: body.title !== undefined ? body.title : existing.title,
          category: body.category !== undefined ? body.category : existing.category,
          compatible: body.compatible !== undefined ? body.compatible : existing.compatible,
          features: body.features !== undefined ? JSON.stringify(body.features) : existing.features,
          image: body.image !== undefined ? body.image : existing.image,
          market_focus: body.marketFocus !== undefined ? JSON.stringify(body.marketFocus) : existing.market_focus,
          details: body.details !== undefined ? JSON.stringify(body.details) : existing.details,
          series: body.series !== undefined ? body.series : existing.series,
          status: body.status !== undefined ? body.status : existing.status,
        };
        await env.DB.prepare(
          `UPDATE products SET title=?, category=?, compatible=?, features=?, image=?, market_focus=?, details=?, series=?, status=?, updated_at=datetime('now') WHERE id=?`
        ).bind(fields.title, fields.category, fields.compatible, fields.features, fields.image || '', fields.market_focus, fields.details, fields.series || '', fields.status || 'active', id).run();
        const row = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
        return json(formatProduct(row));
      }

      case 'DELETE': {
        const id = url.searchParams.get('id');
        if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        await env.DB.prepare('UPDATE products SET status=?, updated_at=datetime(?) WHERE id=?').bind('archived', 'now', id).run();
        return json({ archived: id });
      }

      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json', Allow: 'GET,POST,PUT,DELETE' },
        });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function formatProduct(row) {
  return {
    ...row,
    features: safeParse(row.features),
    market_focus: safeParse(row.market_focus),
    details: row.details ? safeParse(row.details) : null,
  };
}

function safeParse(str) {
  try { return typeof str === 'string' ? JSON.parse(str) : (Array.isArray(str) ? str : []); }
  catch { return []; }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
  });
}
