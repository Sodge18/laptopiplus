export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // === KONFIGURACIJA (prebaci u env secrets kasnije) ===
    const AUTH_TOKEN = env.AUTH_TOKEN; // wrangler secret put AUTH_TOKEN "tvoj-jako-jak-token"
    const IMGUR_CLIENT_ID = env.IMGUR_CLIENT_ID; // wrangler secret put IMGUR_CLIENT_ID "tvoj-client-id"
    const ALLOWED_ORIGIN = env.ALLOWED_ORIGIN || "https://tvoj-sajt.com"; // ili tvoj Cloudflare Pages domen

    const corsHeaders = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json",
    };

    // === OPTIONS (CORS preflight) ===
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders, status: 204 });
    }

    // === Auth helper ===
    function checkAuth() {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader || authHeader !== `Bearer ${AUTH_TOKEN}`) {
        return new Response("Unauthorized", { status: 401 });
      }
      return null;
    }

    const KV = env.KV_BINDING;
    const PRODUCTS_KEY = "products";
    const HISTORY_KEY = "products_history";
    const MAX_HISTORY = 500; // Ograniči history da ne raste beskonačno

    // === Helper: Log history (sa limitom) ===
    async function logHistory(entry) {
      let raw = await KV.get(HISTORY_KEY) || "[]";
      let history = [];
      try { history = JSON.parse(raw); } catch {}
      if (!Array.isArray(history)) history = [];

      history.push(entry);
      // Održavaj samo zadnjih MAX_HISTORY
      if (history.length > MAX_HISTORY) {
        history = history.slice(-MAX_HISTORY);
      }
      await KV.put(HISTORY_KEY, JSON.stringify(history));
    }

    // === GET: Public products (za sajt) ===
    if (request.method === "GET" && !url.searchParams.has("history")) {
      let raw = await KV.get(PRODUCTS_KEY) || "[]";
      let products = [];
      try { products = JSON.parse(raw); } catch {}
      if (!Array.isArray(products)) products = [];

      return new Response(JSON.stringify({ products }), { headers: corsHeaders });
    }

    // === GET: History (samo za owner, sa auth) ===
    if (request.method === "GET" && url.searchParams.get("history") === "true") {
      const authError = checkAuth();
      if (authError) return authError;

      const raw = await KV.get(HISTORY_KEY) || "[]";
      return new Response(raw, { headers: corsHeaders });
    }

    // === POST: Upload slika (novi endpoint za admin) ===
    if (request.method === "POST" && url.pathname.endsWith("/upload")) {
      const authError = checkAuth();
      if (authError) return authError;

      if (!IMGUR_CLIENT_ID) {
        return new Response(JSON.stringify({ error: "Imgur not configured" }), { status: 500 });
      }

      const formData = await request.formData();
      const image = formData.get("image");
      if (!image) {
        return new Response(JSON.stringify({ error: "No image" }), { status: 400 });
      }

      const imgurRes = await fetch("https://api.imgur.com/3/image", {
        method: "POST",
        headers: { "Authorization": `Client-ID ${IMGUR_CLIENT_ID}` },
        body: formData
      });

      const data = await imgurRes.json();
      if (data.success) {
        return new Response(JSON.stringify({ link: data.data.link }), { headers: corsHeaders });
      } else {
        return new Response(JSON.stringify({ error: "Imgur upload failed" }), { status: 500 });
      }
    }

    // === POST / DELETE: Admin operacije (zahtijevaju auth) ===
    const authError = checkAuth();
    if (authError) return authError;

    // === POST: Add / Update / Clear ===
    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}));

      if (body.clear === true) {
        await KV.put(PRODUCTS_KEY, "[]");
        await logHistory({ action: "CLEAR_ALL", timestamp: new Date().toISOString() });
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      let raw = await KV.get(PRODUCTS_KEY) || "[]";
      let products = [];
      try { products = JSON.parse(raw); } catch {}
      if (!Array.isArray(products)) products = [];

      const id = body.id || crypto.randomUUID();
      const index = products.findIndex(p => p.id === id);

      if (index > -1) {
        const before = { ...products[index] };
        products[index] = {
          ...products[index],
          ...body,
          id,
          modified: new Date().toISOString()
        };
        const after = products[index];

        await logHistory({
          id, action: "UPDATE", title: after.title || "",
          timestamp: new Date().toISOString(),
          snapshot: { _before: before, _after: after }
        });
      } else {
        const newProduct = {
          ...body, id,
          added: new Date().toISOString(),
          modified: null
        };
        products.push(newProduct);
        await logHistory({
          id, action: "ADD", title: newProduct.title || "",
          timestamp: new Date().toISOString(),
          snapshot: newProduct
        });
      }

      await KV.put(PRODUCTS_KEY, JSON.stringify(products));
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    // === DELETE ===
    if (request.method === "DELETE") {
      const id = url.searchParams.get("id");
      if (!id) return new Response("Missing ID", { status: 400 });

      let raw = await KV.get(PRODUCTS_KEY) || "[]";
      let products = [];
      try { products = JSON.parse(raw); } catch {}
      if (!Array.isArray(products)) products = [];

      const deleted = products.find(p => p.id === id);
      if (deleted) {
        await logHistory({
          id, action: "DELETE", title: deleted.title || "",
          timestamp: new Date().toISOString(),
          snapshot: deleted
        });
      }

      products = products.filter(p => p.id !== id);
      await KV.put(PRODUCTS_KEY, JSON.stringify(products));
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    return new Response("Not found", { status: 404 });
  }
};
