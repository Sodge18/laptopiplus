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

// --- RENDER CURRENT PRODUCT SA NOVIM DIZAJNOM ---
function renderCurrentProduct() {
  if (currentIndex === null || !products[currentIndex]) {
    content.innerHTML = `
      <div class="text-center mt-20 text-gray-500 text-lg">
        Nema proizvoda. Dodajte novi klikom na <strong>+ Novi proizvod</strong>.
      </div>
    `;
    return;
  }

  const p = products[currentIndex];
  const specsList = ["CPU","RAM","GPU","Memorija","Ekran","Baterija","OS","Težina","Dimenzije","Portovi","Bežične konekcije","Kamera","Audio"];
  if (!p.specs) p.specs = {};
  specsList.forEach(label => { if (!(label in p.specs)) p.specs[label] = ""; });

  content.innerHTML = `
    <div class="grid grid-cols-3 gap-6">
      <div class="col-span-2 space-y-6">
        <header class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-white dark:bg-slate-900 sticky top-0 z-10">
          <h2 class="text-lg font-bold text-slate-900 dark:text-white">
            Detalji proizvoda: ${p.title || ''}
          </h2>
        </header>
        <div class="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div>
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Naziv proizvoda</label>
            <input id="title" value="${p.title||''}" class="mt-1 block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-primary focus:ring-primary dark:text-white"/>
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Kratak opis</label>
            <input id="shortDesc" value="${p.shortDesc||''}" class="mt-1 block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-primary focus:ring-primary dark:text-white"/>
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Detaljan opis</label>
            <textarea id="description" rows="5" class="mt-1 block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-primary focus:ring-primary dark:text-white">${p.description||''}</textarea>
          </div>
        </div>

        <div class="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-2">Specifikacije</h3>
          <div id="specsContainer" class="space-y-2">
            ${specsList.map(label => `
              <div class="flex gap-2 items-center">
                <span class="spec-label flex-1 font-semibold text-slate-700 dark:text-slate-300">${label}</span>
                <input type="text" class="spec-value flex-1 rounded-lg border p-1 dark:bg-slate-800 dark:text-white" data-label="${label}" value="${p.specs[label]}"/>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="col-span-1 space-y-6">
        <div class="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-2">Slike</h3>
          <div class="mb-2 text-sm text-slate-600 dark:text-slate-400" id="imageCount">Trenutni broj slika: ${p.images.length}</div>
          <div id="imageCarousel" class="flex gap-2 overflow-x-auto pb-2">
            ${(p.images||[]).map((src,i)=>`
              <div class="relative flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                <img src="${src}" class="w-full h-full object-cover"/>
                <button class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs" data-index="${i}" title="Obriši sliku">×</button>
              </div>
            `).join('')}
          </div>
          <button id="imageUpload" class="w-full py-2 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary hover:text-primary text-slate-500 dark:text-slate-400">+ Nova fotografija</button>
        </div>

        <div class="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-2">Cena €</h3>
          <input id="price" value="${p.price==='Cena na upit'?'':p.price}" class="mt-1 block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-primary focus:ring-primary dark:text-white"/>
        </div>

        <div class="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-2">Tagovi</h3>
          <div id="tagContainer" class="flex flex-wrap gap-2">
            ${TAGS.map(tag => `<button type="button" data-tag="${tag}" class="tag-btn px-3 py-1 rounded-lg ${tag===p.tag?'active':''}">${tag}</button>`).join('')}
          </div>
        </div>

        <div class="flex gap-2">
          <button id="saveBtn" class="bg-indigo-500 text-white px-4 py-2 rounded-lg flex-1">Sačuvaj</button>
          <button id="deleteBtn" class="bg-red-500 text-white px-4 py-2 rounded-lg flex-1">Obriši</button>
        </div>

        <span class="save-confirm hidden" id="saveConfirm">Sačuvano!</span>
      </div>
    </div>
  `;

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
