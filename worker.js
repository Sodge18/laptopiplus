export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders, status: 204 });
    }

    const KV = env.KV_BINDING;
    const KEY = "products";

    // 1. GET – vraća { products: [...] }
    if (request.method === "GET" && url.pathname === "/") {
      let raw = await KV.get(KEY);
      if (!raw) raw = "[]";
      let productsArray = [];
      try {
        productsArray = JSON.parse(raw);
        if (!Array.isArray(productsArray)) productsArray = [];
      } catch (e) {
        productsArray = [];
      }
      return new Response(JSON.stringify({ products: productsArray }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. POST – SADA POPRAVLJENO: Ako je { products: [...] } → zamenjuje CELO niz! Inače, dodaje/izmenjuje jedan
    if (request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return new Response("Invalid JSON", { status: 400 });
      }

      let products = [];
      let raw = await KV.get(KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          products = Array.isArray(parsed) ? parsed : [];
        } catch (e) { /* ignore */ }
      }

      // KLJUČNA PROMENA: Ako body ima 'products' polje → ovo je "zameni ceo niz" (za čišćenje)
      if (body && body.products && Array.isArray(body.products)) {
        products = body.products;  // ← ZAMENJUJE CELO, ne dodaje!
      } else {
        // Inače, normalno dodavanje/izmena jednog proizvoda
        const urlId = url.searchParams.get("id");
        if (urlId) {
          const index = products.findIndex(p => p.id === urlId);
          if (index !== -1) {
            products[index] = { ...products[index], ...body };
          } else {
            body.id = urlId;
            products.push(body);
          }
        } else {
          if (!body.id) body.id = crypto.randomUUID();
          products.push(body);
        }
      }

      await KV.put(KEY, JSON.stringify(products, null, 2));
      return new Response(JSON.stringify({ success: true, count: products.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. DELETE – brisanje po ID
    if (request.method === "DELETE") {
      const idToDelete = url.searchParams.get("id");
      if (!idToDelete) return new Response("Missing id", { status: 400 });

      let products = [];
      let raw = await KV.get(KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          products = Array.isArray(parsed) ? parsed : [];
        } catch (e) { /* ignore */ }
      }

      const filtered = products.filter(p => p.id !== idToDelete);
      await KV.put(KEY, JSON.stringify(filtered, null, 2));

      return new Response(JSON.stringify({ success: true, count: filtered.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Not found", { status: 404 });
  }
};
