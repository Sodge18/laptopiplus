export default {
  async fetch(request, env) {
    const url = new URL(request.url);
  
    const AUTH_TOKEN = env.AUTH_TOKEN;
    const IMGUR_CLIENT_ID = env.IMGUR_CLIENT_ID;
    const ALLOWED_ORIGIN = env.ALLOWED_ORIGIN || "*";

    const corsHeaders = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders, status: 204 });
    }

    const KV = env.KV_BINDING;
    const PRODUCTS_KEY = "products";
    const HISTORY_KEY = "products_history";
    const MAX_HISTORY = 500;

    async function logHistory(entry) {
      let raw = await KV.get(HISTORY_KEY) || "[]";
      let history = [];
      try { history = JSON.parse(raw); } catch {}
      if (!Array.isArray(history)) history = [];
      history.push(entry);
      if (history.length > MAX_HISTORY) history = history.slice(-MAX_HISTORY);
      await KV.put(HISTORY_KEY, JSON.stringify(history));
    }

    function checkAuth() {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader || authHeader !== `Bearer ${AUTH_TOKEN}`) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: corsHeaders
        });
      }
      return null;
    }

    // PUBLIC GET
    if (request.method === "GET" && !url.searchParams.has("history")) {
      let raw = await KV.get(PRODUCTS_KEY) || "[]";
      let products = [];
      try { products = JSON.parse(raw); } catch {}
      if (!Array.isArray(products)) products = [];
      return new Response(JSON.stringify({ products }), { headers: corsHeaders });
    }

    // HISTORY
    if (request.method === "GET" && url.searchParams.get("history") === "true") {
      const authError = checkAuth();
      if (authError) return authError;
      const raw = await KV.get(HISTORY_KEY) || "[]";
      return new Response(raw, { headers: corsHeaders });
    }

    // ======================
    // ✅ UPLOAD (FIXED)
    // ======================
    if (request.method === "POST" && url.pathname.endsWith("/upload")) {
      if (!IMGUR_CLIENT_ID) {
        return new Response(JSON.stringify({ error: "Imgur not configured" }), {
          status: 500,
          headers: corsHeaders
        });
      }

      const incoming = await request.formData();
      const image = incoming.get("image");

      if (!image || typeof image === "string") {
        return new Response(JSON.stringify({ error: "Invalid image" }), {
          status: 400,
          headers: corsHeaders
        });
      }

      // 🔥 KLJUČNA POPRAVKA: rebuild FormData
      const imgurForm = new FormData();
      imgurForm.append("image", image, image.name);

      const imgurRes = await fetch("https://api.imgur.com/3/image", {
        method: "POST",
        headers: {
          "Authorization": `Client-ID ${IMGUR_CLIENT_ID}`
        },
        body: imgurForm
      });

      const data = await imgurRes.json();

      if (!data.success || !data.data?.link) {
        return new Response(JSON.stringify({
          error: "Imgur upload failed",
          details: data
        }), {
          status: 500,
          headers: corsHeaders
        });
      }

      return new Response(JSON.stringify({
        link: data.data.link
      }), { headers: corsHeaders });
    }

    // POST (add/update/clear)
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
        products[index] = { ...products[index], ...body, id, modified: new Date().toISOString() };
        await logHistory({
          id,
          action: "UPDATE",
          title: products[index].title || "",
          timestamp: new Date().toISOString(),
          snapshot: { _before: before, _after: products[index] }
        });
      } else {
        const newProduct = { ...body, id, added: new Date().toISOString(), modified: null };
        products.push(newProduct);
        await logHistory({
          id,
          action: "ADD",
          title: newProduct.title || "",
          timestamp: new Date().toISOString(),
          snapshot: newProduct
        });
      }

      await KV.put(PRODUCTS_KEY, JSON.stringify(products));
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    // DELETE
    if (request.method === "DELETE") {
      const id = url.searchParams.get("id");
      if (!id) {
        return new Response(JSON.stringify({ error: "Missing ID" }), {
          status: 400,
          headers: corsHeaders
        });
      }

      let raw = await KV.get(PRODUCTS_KEY) || "[]";
      let products = [];
      try { products = JSON.parse(raw); } catch {}
      if (!Array.isArray(products)) products = [];

      const deleted = products.find(p => p.id === id);
      if (deleted) {
        await logHistory({
          id,
          action: "DELETE",
          title: deleted.title || "",
          timestamp: new Date().toISOString(),
          snapshot: deleted
        });
      }

      products = products.filter(p => p.id !== id);
      await KV.put(PRODUCTS_KEY, JSON.stringify(products));
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: corsHeaders
    });
  }
};
