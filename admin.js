const API_URL = 'https://products-api.sergej-kaldesic.workers.dev/';
let products = [];

// Fetch proizvode iz KV i renderuj ih
async function fetchProducts() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Failed to fetch products from KV");
    products = await res.json();
    renderProducts();
    alert("Products loaded from KV successfully! ✅"); // potvrda da KV radi
    console.log("Products loaded:", products);
  } catch (err) {
    console.error("Error fetching products:", err);
    alert("Failed to load products from KV ❌");
    document.getElementById('products-list').innerHTML = '<p>Unable to load products.</p>';
  }
}

// Render proizvode u admin dashboard
function renderProducts() {
  const list = document.getElementById('products-list');
  list.innerHTML = products.map((p, i) => `
    <div>
      <input value="${p.title}" data-index="${i}" class="title"/>
      <input value="${p.shortDesc}" data-index="${i}" class="shortDesc"/>
      <input value="${p.price}" data-index="${i}" class="price"/>
      <button data-index="${i}" class="save">Save</button>
      <button data-index="${i}" class="delete">Delete</button>
    </div>
  `).join('');

  // Dugme Save
  document.querySelectorAll('.save').forEach(btn => {
    btn.onclick = async (e) => {
      const i = e.target.dataset.index;
      products[i].title = document.querySelector(`.title[data-index="${i}"]`).value;
      products[i].shortDesc = document.querySelector(`.shortDesc[data-index="${i}"]`).value;
      products[i].price = document.querySelector(`.price[data-index="${i}"]`).value;
      await saveProducts(i);
    }
  });

  // Dugme Delete
  document.querySelectorAll('.delete').forEach(btn => {
    btn.onclick = async (e) => {
      const i = e.target.dataset.index;
      products.splice(i, 1);
      await saveProducts();
      renderProducts();
    }
  });
}

// Dodavanje novog proizvoda
document.getElementById('add-product').onclick = () => {
  products.push({
    id: Date.now(),
    title: 'New Product',
    shortDesc: '',
    price: '',
    images: [],
    tag: '',
    description: ''
  });
  renderProducts();
}

// Spremanje proizvoda u KV
async function saveProducts(index = null) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(products)
    });

    if (res.ok) {
      if (index !== null) {
        alert(`Product #${index + 1} saved successfully! ✅`);
      } else {
        alert("Products saved successfully! ✅");
      }
      console.log("Products sent to KV:", products);
    } else {
      alert("Failed to save products ❌");
      console.error("Failed response:", res);
    }
  } catch (err) {
    console.error("Error saving products:", err);
    alert("Error saving products ❌");
  }
}

// Pokreni odmah
fetchProducts();
