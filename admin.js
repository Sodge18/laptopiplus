const API_URL = 'https://products-api.sergej-kaldesic.workers.dev/';
let products = [];

async function fetchProducts() {
  const res = await fetch(API_URL);
  products = await res.json();
  renderProducts();
}

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

  document.querySelectorAll('.save').forEach(btn=>{
    btn.onclick = async (e)=>{
      const i = e.target.dataset.index;
      products[i].title = document.querySelector(`.title[data-index="${i}"]`).value;
      products[i].shortDesc = document.querySelector(`.shortDesc[data-index="${i}"]`).value;
      products[i].price = document.querySelector(`.price[data-index="${i}"]`).value;
      await saveProducts();
    }
  });

  document.querySelectorAll('.delete').forEach(btn=>{
    btn.onclick = async (e)=>{
      const i = e.target.dataset.index;
      products.splice(i,1);
      await saveProducts();
      renderProducts();
    }
  });
}

document.getElementById('add-product').onclick = ()=>{
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

async function saveProducts() {
  await fetch(API_URL, {
    method: 'POST',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(products)
  });
}

fetchProducts();
