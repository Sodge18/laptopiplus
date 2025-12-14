// --- DEBOUNCE ---
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// --- KONFIG ---
const API_URL = "https://products-api.sergej-kaldesic.workers.dev/";
let products = [];
let currentIndex = null;

const sidebar = document.getElementById("product-sidebar");
const content = document.getElementById("product-details");
const addBtn = document.getElementById("add-product-btn");
const TAGS = ["Novo", "Poslovni", "Gamer", "Premium"];

// --- INIT ---
init();

async function init() {
  await fetchProducts();
  addBtn.addEventListener("click", addNewProduct);
}

// --- FETCH PRODUCTS ---
async function fetchProducts() {
  showSpinner();
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    products = Array.isArray(data.products) ? data.products : [];
    if (products.length) currentIndex = 0;
    renderSidebar();
    renderCurrentProduct();
  } catch (err) {
    console.error(err);
    content.innerHTML = `<div class="text-center mt-20 text-red-500 text-lg">Greška pri učitavanju proizvoda.</div>`;
  }
}

// --- SIDEBAR ---
function renderSidebar() {
  sidebar.innerHTML = "";
  products.forEach((p, i) => {
    const btn = document.createElement("button");
    btn.textContent = p.title || "Bez naziva";
    btn.className = "product-tab" + (i === currentIndex ? " active" : "");
    btn.onclick = () => {
      currentIndex = i;
      renderSidebar();
      renderCurrentProduct();
    };
    sidebar.appendChild(btn);
  });
}

// --- RENDER CURRENT PRODUCT ---
function renderCurrentProduct() {
  if (currentIndex === null || !products[currentIndex]) {
    content.innerHTML = `<div class="text-center mt-20 text-gray-500 text-lg">Nema proizvoda. Dodajte novi klikom na + Novi proizvod.</div>`;
    return;
  }

  const p = products[currentIndex];
  const specsList = ["CPU","RAM","GPU","Memorija","Ekran","Baterija","OS","Težina","Dimenzije","Portovi","Bežične konekcije","Kamera","Audio"];
  if (!p.specs) p.specs = {};
  specsList.forEach(label => { if (!(label in p.specs)) p.specs[label] = ""; });

  content.innerHTML = `
  <div class="grid grid-cols-3 gap-6">
    <div class="col-span-2 space-y-6">
      <div>
        <label>Naziv proizvoda</label>
        <input id="title" value="${p.title||''}" class="input-field"/>
      </div>
      <div>
        <label>Kratak opis</label>
        <input id="shortDesc" value="${p.shortDesc||''}" class="input-field"/>
      </div>
      <div>
        <label>Detaljan opis</label>
        <textarea id="description" class="input-field">${p.description||''}</textarea>
      </div>
      <div>
        <h3>Specifikacije</h3>
        <div id="specsContainer">
          ${specsList.map(label => `
            <div class="spec-row">
              <span class="spec-label">${label}</span>
              <input class="spec-value" data-label="${label}" value="${p.specs[label]}"/>
            </div>
          `).join("")}
        </div>
      </div>
    </div>

    <div class="col-span-1 space-y-4">
      <div>
        <h3>Slike (${(p.images||[]).length})</h3>
        <div id="imageCarousel" class="flex gap-2 overflow-x-auto">
          ${(p.images||[]).map((src,i)=>`
            <div class="relative">
              <img src="${src}" class="w-32 h-32 object-cover"/>
              <button data-index="${i}" class="delete-image-btn">×</button>
            </div>
          `).join("")}
        </div>
        <button id="imageUpload">+ Nova slika</button>
      </div>

      <div>
        <label>Cena €</label>
        <input id="price" value="${p.price==='Cena na upit'?'':p.price}" class="input-field"/>
      </div>

      <div>
        <h3>Tagovi</h3>
        <div id="tagContainer">
          ${TAGS.map(tag => `<button data-tag="${tag}" class="tag-btn${tag===p.tag?' active':''}">${tag}</button>`).join("")}
        </div>
      </div>

      <div class="flex gap-2">
        <button id="saveBtn">Sačuvaj</button>
        <button id="deleteBtn">Obriši</button>
      </div>
    </div>
  </div>
  `;

  // --- EVENTI ---
  bindEvents();
}

// --- BIND EVENTS ---
function bindEvents() {
  if (currentIndex === null) return;
  const p = products[currentIndex];

  // Inputs
  ["title","shortDesc","description","price"].forEach(id=>{
    document.getElementById(id).oninput = debounce(e=>{
      const val = e.target.value.trim();
      switch(id){
        case "title": p.title = val; break;
        case "shortDesc": p.shortDesc = val; break;
        case "description": p.description = val; break;
        case "price": p.price = val || "Cena na upit"; break;
      }
      renderSidebar();
    },300);
  });

  // Specs
  document.querySelectorAll(".spec-value").forEach(input=>{
    input.oninput = debounce(e=>{
      const label = input.dataset.label;
      p.specs[label] = input.value.trim();
    },300);
  });

  // Tags
  document.querySelectorAll(".tag-btn").forEach(btn=>{
    btn.onclick = ()=>{
      p.tag = btn.dataset.tag;
      document.querySelectorAll(".tag-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
    };
  });

  // Image delete
  document.querySelectorAll(".delete-image-btn").forEach(btn=>{
    btn.onclick = ()=>{
      const idx = parseInt(btn.dataset.index);
      if (!isNaN(idx)) {
        p.images.splice(idx,1);
        renderCurrentProduct();
      }
    };
  });

  // Image upload
  document.getElementById("imageUpload").onclick = ()=>{
    const fi = document.createElement("input");
    fi.type = "file"; fi.accept="image/*"; fi.multiple=true;
    fi.click();
    fi.onchange = e=>{
      const files = [...fi.files];
      files.forEach(f=>{
        const reader = new FileReader();
        reader.onload = ev=>{
          if(!p.images) p.images=[];
          p.images.push(ev.target.result);
          renderCurrentProduct();
        };
        reader.readAsDataURL(f);
      });
    };
  };

  // Save & Delete
  document.getElementById("saveBtn").onclick = saveProduct;
  document.getElementById("deleteBtn").onclick = deleteProduct;
}

// --- SAVE PRODUCT ---
async function saveProduct() {
  if (currentIndex===null) return;
  const p = products[currentIndex];

  if (!p.title || !p.shortDesc || !p.description || !p.tag || (p.images||[]).length===0){
    Swal.fire({icon:"error", text:"Popunite sva polja!"});
    return;
  }

  try {
    await fetch(`${API_URL}?id=${p.id}`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(p)
    });
    Swal.fire({icon:"success", text:"Sačuvano!"});
    renderSidebar();
  } catch(err){
    console.error(err);
    Swal.fire({icon:"error", text:"Greška pri čuvanju!"});
  }
}

// --- DELETE PRODUCT ---
async function deleteProduct() {
  if (currentIndex===null) return;
  const p = products[currentIndex];
  const res = await Swal.fire({
    title:"Obrisati proizvod?",
    text: p.title,
    showCancelButton:true,
    confirmButtonText:"Da",
    cancelButtonText:"Otkaži"
  });
  if (!res.isConfirmed) return;

  try {
    await fetch(`${API_URL}?id=${p.id}`,{method:"DELETE"});
    products.splice(currentIndex,1);
    currentIndex = products.length ? 0 : null;
    renderSidebar();
    renderCurrentProduct();
    Swal.fire({icon:"success", text:"Proizvod obrisan!"});
  } catch(err){
    console.error(err);
    Swal.fire({icon:"error", text:"Greška pri brisanju!"});
  }
}

// --- ADD NEW PRODUCT ---
function addNewProduct() {
  const newProd = {id:crypto.randomUUID(), title:"", shortDesc:"", description:"", specs:{}, price:"", tag:"Novo", images:[]};
  products.push(newProd);
  currentIndex = products.length-1;
  renderSidebar();
  renderCurrentProduct();
}

// --- SPINNER ---
function showSpinner() {
  content.innerHTML = `<div class="flex justify-center items-center h-full">Učitavanje...</div>`;
}
