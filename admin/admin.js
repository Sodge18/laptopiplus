const owner = 'Sodge18';
const repo = 'laptopiplus';
const path = 'data/products.json';
const branch = 'main';

let products = [];

async function fetchProducts(token) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    headers: { Authorization: `token ${token}` }
  });
  const data = await res.json();
  const content = atob(data.content);
  products = JSON.parse(content);
  renderProducts();
  return data.sha; // potrebna za commit
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
      const token = document.getElementById('token').value;
      await commitProducts(token);
    }
  });

  document.querySelectorAll('.delete').forEach(btn=>{
    btn.onclick = async (e)=>{
      const i = e.target.dataset.index;
      products.splice(i,1);
      const token = document.getElementById('token').value;
      await commitProducts(token);
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

let currentSha = '';

async function commitProducts(token){
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: { Authorization: `token ${token}` },
    body: JSON.stringify({
      message: 'Update products via admin dashboard',
      content: btoa(JSON.stringify(products, null, 2)),
      sha: currentSha,
      branch
    })
  });
  const data = await res.json();
  currentSha = data.content.sha;
}

// fetch products kada se unese token
document.getElementById('token').onchange = async (e)=>{
  const token = e.target.value;
  currentSha = (await fetchProducts(token));
};
