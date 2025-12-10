const API_URL = "https://products-api.sergej-kaldesic.workers.dev/";

async function loadProduct() {
    const url = new URL(window.location.href);
    const id = url.searchParams.get("id");

    const res = await fetch(API_URL);
    const data = await res.json();
    const products = data.products || data;

    const product = products.find(p => p.id === id);

    if (!product) {
        document.body.innerHTML = `
            <div class="text-center mt-20">
                <h1 class="text-3xl font-bold text-red-600">Proizvod nije pronađen</h1>
                <a href="index.html" class="text-primary font-semibold underline mt-4 inline-block">Nazad</a>
            </div>
        `;
        return;
    }

    document.getElementById("p-title").textContent = product.title;
    document.getElementById("p-price").textContent = product.price ? product.price + "€" : "Cena na upit";
    document.getElementById("p-desc").textContent = product.description || product.shortDesc || "";

    // SPECIFIKACIJE
    const specs = document.getElementById("p-specs");
    specs.innerHTML = "";

    Object.entries(product.specs || {}).forEach(([label, value]) => {
        specs.innerHTML += `
            <div class="flex justify-between bg-white p-3 rounded-lg shadow">
                <span class="font-medium">${label}</span>
                <span class="font-semibold">${value || "-"}</span>
            </div>
        `;
    });

    // GALERIJA
    const imgs = product.images && product.images.length > 0 ? product.images : [];

    if (imgs.length > 0) {
        document.getElementById("gallery-main").innerHTML =
            `<img src="${imgs[0]}" class="w-full h-full object-contain">`;

        const thumbs = document.getElementById("gallery-thumbs");
        thumbs.innerHTML = "";

        imgs.forEach((src, index) => {
            thumbs.innerHTML += `
                <img src="${src}" 
                     class="w-20 h-20 rounded-lg shadow cursor-pointer hover:opacity-80"
                     onclick="document.getElementById('gallery-main').innerHTML='<img src=${JSON.stringify(src)} class=\'w-full h-full object-contain\'>'">
            `;
        });
    }

    // IZABERI LAPTOP
    document.getElementById("chooseBtn").addEventListener("click", () => {
        window.location.href = `index.html?selected=${product.id}#contact-form-section`;
    });
}

loadProduct();
