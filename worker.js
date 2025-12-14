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
    const PRODUCTS_KEY = "products";
    const HISTORY_KEY = "products_history";

    // =========================
    // HELPER: LOG HISTORY
    // =========================
    async function logHistory(entry) {
      let raw = await KV.get(HISTORY_KEY) || "[]";
      let history = [];
      try { history = JSON.parse(raw); } catch {}
      if (!Array.isArray(history)) history = [];

      history.push(entry);
      await KV.put(HISTORY_KEY, JSON.stringify(history));
    }

    // =========================
    // GET HISTORY (OWNER)
    // =========================
    if (request.method === "GET" && url.searchParams.get("history") === "true") {
      const raw = await KV.get(HISTORY_KEY) || "[]";
      return new Response(raw, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    // =========================
    // GET PRODUCTS (SITE + ADMIN)
    // =========================
    if (request.method === "GET") {
      let raw = await KV.get(PRODUCTS_KEY) || "[]";
      let products = [];
      try { products = JSON.parse(raw); } catch {}
      if (!Array.isArray(products)) products = [];

      return new Response(JSON.stringify({ products }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    // =========================
    // POST (ADD / UPDATE / CLEAR)
    // =========================
    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}));

      // CLEAR ALL
      if (body.clear === true) {
        await KV.put(PRODUCTS_KEY, "[]");
        await logHistory({
          action: "CLEAR_ALL",
          timestamp: new Date().toISOString()
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }

      let raw = await KV.get(PRODUCTS_KEY) || "[]";
      let products = [];
      try { products = JSON.parse(raw); } catch {}
      if (!Array.isArray(products)) products = [];

      const id = body.id || crypto.randomUUID();
      const index = products.findIndex(p => p.id === id);

      if (index > -1) {
        // UPDATE
        products[index] = {
          ...products[index],
          ...body,
          id,
          modified: new Date().toISOString()
        };

        await logHistory({
          id,
          action: "UPDATE",
          title: products[index].title || "",
          timestamp: new Date().toISOString(),
          snapshot: products[index]
        });
      } else {
        // ADD
        const newProduct = {
          ...body,
          id,
          added: new Date().toISOString(),
          modified: null
        };

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

      return new Response(JSON.stringify({ success: true }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    // =========================
    // DELETE PRODUCT
    // =========================
    if (request.method === "DELETE") {
      const id = url.searchParams.get("id");
      if (!id) {
        return new Response("Missing ID", { status: 400 });
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

      return new Response(JSON.stringify({ success: true }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    return new Response("Not found", { status: 404 });
  }
};
