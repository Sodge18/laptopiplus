export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",           // ← change to your domain later if you want
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders, status: 204 });
    }

    const key = "products";

    // ←←← ONLY THESE TWO LINES CHANGED ←←←
    if (request.method === "GET") {
      const products = await env.KV_BINDING.get(key);
      return new Response(products || "[]", {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (request.method === "POST") {
      const body = await request.json();
      await env.KV_BINDING.put(key, JSON.stringify(body, null, 2));
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405 });
  }
};
