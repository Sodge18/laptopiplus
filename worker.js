export default {
  async fetch(request, env) {
    const url = new URL(request.url);
  
    const AUTH_TOKEN = env.AUTH_TOKEN;
    const IMGUR_CLIENT_ID = env.IMGUR_CLIENT_ID;
    const ALLOWED_ORIGIN = env.ALLOWED_ORIGIN || "*"; // Kasnije stavi "https://laptopiplus.pages.dev"

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
          headers: corsHeaders  // OVDE JE KLJUČNO!
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

    // AUTH OBAVEZAN ZA SVE OSTALO
    const authError = checkAuth();
    if (authError) return authError;

    // UPLOAD
    if (request.method === "POST" && url.pathname.endsWith("/upload")) {
      if (!IMGUR_CLIENT_ID) {
        return new Response(JSON.stringify({ error: "Imgur not configured" }), {
          status: 500,
          headers: corsHeaders
        });
      }
      const formData = await request.formData();
      const image = formData.get("image");
      if (!image) {
        return new Response(JSON.stringify({ error: "No image" }), {
          status: 400,
          headers: corsHeaders
        });
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
        return new Response(JSON.stringify({ error: "Imgur upload failed", details: data }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // POST / DELETE – dodaj corsHeaders na sve return-ove
    if (request.method === "POST") {
      // ... cijeli kod isti ...
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    if (request.method === "DELETE") {
      // ... cijeli kod isti ...
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: corsHeaders
    });
  }
};
