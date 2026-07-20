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
    if (auth !== `Bearer ${token}` && auth !== `***${token}`) {
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
        const detailsObj = body.details || {};
        if (body.series && !detailsObj.series) detailsObj.series = body.series;
        const details = JSON.stringify(detailsObj);
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
        if (!existing) return json({ error: 'Not found' }, 404);
        const detObj = body.details || (existing.details ? JSON.parse(existing.details) : {});
        if (body.series !== undefined && body.series !== null) detObj.series = body.series;
        const features = JSON.stringify(body.features || JSON.parse(existing.features || '[]'));
        const marketFocus = JSON.stringify(body.marketFocus || JSON.parse(existing.market_focus || '[]'));
        await env.DB.prepare(
          'UPDATE products SET title=?, category=?, compatible=?, features=?, image=?, market_focus=?, details=?, updated_at=datetime(?) WHERE id=?'
        ).bind(body.title || existing.title, body.category || existing.category, body.compatible || existing.compatible, features, body.image || existing.image || '', marketFocus, JSON.stringify(detObj), 'now', id).run();
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
