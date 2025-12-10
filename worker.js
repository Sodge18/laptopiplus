export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders, status: 204 });
    }

    const key = "products";

    // GET – vraća proizvode iz KV
    if (request.method === "GET" && url.pathname === "/") {
      let raw = await env.KV_BINDING.get(key);
      if (!raw) raw = "[]";
    
      let productsArray;
      try {
        productsArray = JSON.parse(raw);
      } catch (e) {
        productsArray = [];
      }
    
      // OVDE JE KLJUČNA PROMENA:
      const responseBody = JSON.stringify({ products: productsArray });
    
      return new Response(responseBody, {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST – čuva proizvode u KV
    if (request.method === "POST" && url.pathname === "/") {
      const body = await request.json();
    
      // UVEK čuvamo SAMO niz proizvoda ili products niz iz body-a
      let productsToSave = [];
    
      if (Array.isArray(body)) {
        productsToSave = body;
      } else if (body && Array.isArray(body.products)) {
        productsToSave = body.products;
      }
    
      // Čuvamo SAMO niz proizvoda, ne ceo objekat!
      await env.KV_BINDING.put(key, JSON.stringify(productsToSave, null, 2));
    
      return new Response(JSON.stringify({ success: true, count: productsToSave.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sve ostalo
    return new Response("Not found", { status: 404 });
  }
};
