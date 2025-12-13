const API_URL = "https://products-api.sergej-kaldesic.workers.dev/";

async function loadProduct() {
    const url = new URL(window.location.href);
    const id = url.searchParams.get("selected");
    if (!id) {
        document.body.innerHTML = `
            <div class="text-center mt-20">
                <h1 class="text-3xl font-bold text-red-600">Proizvod nije pronađen</h1>
                <a href="index.html" class="text-primary font-semibold underline mt-4 inline-block">Nazad</a>
            </div>
        `;
        return;
    }

    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        const products = data.products || data;
        const product = products.find(p => p.id === id || p.id == id);

        if (!product) throw new Error("Laptop nije pronađen");

        populateProduct(product);

    } catch (err) {
        console.error(err);
        document.body.innerHTML = `
            <div class="text-center mt-20">
                <h1 class="text-3xl font-bold text-red-600">Greška pri učitavanju proizvoda</h1>
                <a href="index.html" class="text-primary font-semibold underline mt-4 inline-block">Nazad</a>
            </div>
        `;
    }
}

function populateProduct(product) {
    document.getElementById("p-title").textContent = product.title;
    document.getElementById("p-price").textContent = product.price ? product.price + "€" : "Cena na upit";
    document.getElementById("p-desc").textContent = product.description || product.shortDesc || "";

    // SPECIFIKACIJE
    const specs = document.getElementById("p-specs");
    specs.innerHTML = "";
    Object.entries(product.specs || {}).forEach(([key, value]) => {
      // Preskoči ako je vrijednost prazna, null, undefined ili "-"
      if (!value || value === "" || value === "-" || value === "null" || value === "undefined") {
        return;
      }

      const label = specKeys[key] || key;
      const div = document.createElement("div");
      div.className = "flex justify-between py-4 border-b border-gray-200 last:border-0";
      div.innerHTML = `
        <span class="text-lg text-gray-600">${label}:</span>
        <span class="text-lg font-semibold">${value}</span>
      `;
      specsDiv.appendChild(div);
    });

    // GALERIJA
    const mainGallery = document.getElementById("gallery-main");
    const thumbsDiv = document.getElementById("gallery-thumbs");
    const imgs = product.images && product.images.length > 0 ? product.images : product.image ? [product.image] : ["https://via.placeholder.com/600?text=Laptop"];

    mainGallery.innerHTML = `<img id="main-img" src="${imgs[0]}" class="w-full h-full object-contain">`;

    thumbsDiv.innerHTML = "";
    imgs.forEach((src, index) => {
        const imgEl = document.createElement("img");
        imgEl.src = src;
        imgEl.className = `w-20 h-20 rounded-lg shadow thumbnail ${index===0?'active':''}`;
        imgEl.addEventListener("click", () => {
            document.getElementById("main-img").src = src;
            thumbsDiv.querySelectorAll(".thumbnail").forEach(t => t.classList.remove("active"));
            imgEl.classList.add("active");
        });
        thumbsDiv.appendChild(imgEl);
    });

    // DUGME: Izaberi laptop
    document.getElementById("chooseBtn").addEventListener("click", () => {
        window.location.href = `index.html?selected=${product.id}#contact-form-section`;
    });
}

document.addEventListener("DOMContentLoaded", loadProduct);
