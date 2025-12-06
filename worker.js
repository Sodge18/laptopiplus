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

    // GET – vraća proizvode
    if (request.method === "GET" && url.pathname === "/") {
      const products = await env.KV_BINDING.get(key);
      return new Response(products || "[]", {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST – čuva proizvode u KV
    if (request.method === "POST" && url.pathname === "/") {
      const body = await request.json();
      await env.KV_BINDING.put(key, JSON.stringify(body, null, 2));

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /send – slanje forme na email
    if (request.method === "POST" && url.pathname === "/send") {

      const formData = await request.formData();

      const ime = formData.get("ime");
      const prezime = formData.get("prezime");
      const email = formData.get("email");
      const broj = formData.get("kontakt-broj");
      const laptop = formData.get("laptop");
      const poruka = formData.get("poruka");

      const message = `
Nova poruka sa sajta:

Ime: ${ime}
Prezime: ${prezime}
Email: ${email}
Kontakt broj: ${broj}
Laptop: ${laptop}
Poruka: ${poruka}
      `;

      const mail = await fetch("https://api.mailchannels.net/tx/v1/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: "sergej.kaldesic@gmail.com" }]   // ← OVDJE PROMENI
          }],
          from: {
            email: "no-reply@laptopiplus.rs",
            name: "Laptopi Plus"
          },
          subject: "Nova poruka sa sajta",
          content: [{ type: "text/plain", value: message }]
        })
      });

      return new Response("OK", { status: 200, headers: corsHeaders });
    }


    return new Response("Not found", { status: 404 });
  }
};
