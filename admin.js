// --- DEBOUNCE ---
function debounce(fn, delay=300){
  let timer;
  return function(...args){
    clearTimeout(timer);
    timer = setTimeout(()=>fn.apply(this, args), delay);
  };
}

// --- KONFIG ---
const API_URL = 'https://products-api.sergej-kaldesic.workers.dev/';
let products = [];
let currentIndex = null;

const sidebar = document.getElementById('product-sidebar');
const content = document.getElementById('product-details');
const addBtn = document.getElementById('add-product-btn');

const TAGS = ['Novo', 'Poslovni', 'Gamer', 'Premium'];

// --- SIDEBAR ---
function renderSidebar() {
  sidebar.innerHTML = '';
  products.forEach((p, i) => {
    const btn = document.createElement('button');
    btn.textContent = p.title || 'Bez naziva';
    btn.className = 'product-tab';
    if(i === currentIndex) btn.classList.add('active');
    btn.addEventListener('click', () => {
      currentIndex = i;
      renderSidebar();
      renderProductDetails(currentIndex);
    });
    sidebar.appendChild(btn);
  });
}

// --- RENDER DETALJA ---
function renderProductDetails(index) {
  if(index === null || !products[index]) return;
  const p = products[index];

  const fixedSpecs = ['CPU','RAM','GPU','Memorija','Ekran','Baterija','OS','Težina','Dimenzije','Portovi','Bežične konekcije','Kamera','Audio'];
  if(!p.specs) p.specs = {};
  fixedSpecs.forEach(label => { if(!(label in p.specs)) p.specs[label]=''; });

  content.innerHTML = `
  <div class="grid grid-cols-3 gap-6">
    <div class="col-span-2 space-y-6">
      <header class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-8 py-4 bg-white dark:bg-slate-900 sticky top-0 z-10">
        <h2 class="text-slate-900 dark:text-white text-lg font-bold">
          Detalji proizvoda: ${p.title||''}
        </h2>
      </header>

      <div class="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-4">Product Details</h3>
        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Naziv proizvoda</label>
            <input id="title" type="text" class="mt-1 block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-primary focus:ring-primary dark:text-white" value="${p.title||''}"/>
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Kratak opis</label>
            <input id="shortDesc" type="text" class="mt-1 block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-primary focus:ring-primary dark:text-white" value="${p.shortDesc||''}"/>
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Detaljan opis</label>
            <textarea id="description" rows="5" class="mt-1 block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-primary focus:ring-primary dark:text-white">${p.description||''}</textarea>
          </div>
        </div>
      </div>

      <div class="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-4">Specifikacije</h3>
        <div id="specsContainer" class="space-y-2">
          ${fixedSpecs.map(label => `
            <div class="flex gap-2 items-center">
              <span class="spec-label flex-1 font-semibold">${label}</span>
              <input type="text" class="spec-value flex-1 rounded-lg border p-1" value="${p.specs[label]}"/>
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
              <img src="${src}" class="w-full h-full object-cover">
              <button class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs" data-index="${i}" title="Obriši sliku">×</button>
            </div>
          `).join('')}
        </div>
        <div>
          <button id="imageUpload" class="w-full py-2 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary hover:text-primary text-slate-500 dark:text-slate-400">+ Nova fotografija</button>
        </div>
      </div>

      <div class="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-4">Cena €</h3>
        <input id="price" type="text" class="mt-1 block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-primary focus:ring-primary dark:text-white" value="${p.price==='Cena na upit'?'':p.price}" placeholder="0.00"/>
      </div>

      <div class="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-4">Tagovi</h3>
        <div id="tagContainer" class="flex flex-wrap gap-2">
          ${TAGS.map(tag => `<button type="button" data-tag="${tag}" class="tag-btn px-3 py-1 rounded-lg ${tag===p.tag?'active':''}">${tag}</button>`).join('')}
        </div>
      </div>

      <div class="flex gap-2">
        <button id="saveBtn" class="bg-indigo-500 text-white px-4 py-2 rounded-lg flex-1">Sačuvaj</button>
        <button id="deleteBtn" class="bg-red-500 text-white px-4 py-2 rounded-lg flex-1">Obriši</button>
      </div>
      <span class="save-confirm" id="saveConfirm">Sačuvano!</span>
    </div>
  </div>
  `;

  // --- SPECS UPDATE ---
  const specsContainer = document.getElementById('specsContainer');
  specsContainer.addEventListener('input', debounce(()=>{
    if(currentIndex===null) return;
    const specValues = Array.from(specsContainer.querySelectorAll('div')).reduce((acc, div)=>{
      const label = div.querySelector('.spec-label').textContent;
      const value = div.querySelector('.spec-value').value.trim();
      acc[label] = value;
      return acc;
    }, {});
    products[currentIndex].specs = {...products[currentIndex].specs, ...specValues};
  },300));

  // --- SLIKE ---
  function updateImageCount() {
    const countEl = document.getElementById('imageCount');
    if(countEl) countEl.textContent = `Trenutni broj slika: ${products[currentIndex].images.length}`;
  }

  document.getElementById('imageCarousel').addEventListener('click', e=>{
    const btn = e.target.closest('button[data-index]');
    if(!btn) return;
    const idx = parseInt(btn.dataset.index);
    if(isNaN(idx)) return;
    products[currentIndex].images.splice(idx,1);
    renderProductDetails(currentIndex);
    updateImageCount();
  });

  document.getElementById('imageUpload').addEventListener('click', ()=>{
    const fileInput = document.createElement('input');
    fileInput.type='file';
    fileInput.accept='image/*';
    fileInput.multiple=true;
    fileInput.click();
    fileInput.addEventListener('change', e=>{
      const files = [...e.target.files];
      if(files.length + (products[currentIndex].images?.length||0) > 30){ 
        Swal.fire({icon:'error', text:'Maksimalno 30 slika!'}); 
        return; 
      }
      files.forEach(file=>{
        const reader = new FileReader();
        reader.onload = ev=>{
          if(!products[currentIndex].images) products[currentIndex].images=[];
          products[currentIndex].images.push(ev.target.result);
          renderProductDetails(currentIndex);
          updateImageCount();
        };
        reader.readAsDataURL(file);
      });
    });
  });

  // --- INPUTS ---
  ['title','shortDesc','description','price'].forEach(id=>{
    document.getElementById(id).addEventListener('input', debounce(()=>{
      if(currentIndex===null) return;
      const val = document.getElementById(id).value.trim();
      switch(id){
        case 'title': products[currentIndex].title=val; break;
        case 'shortDesc': products[currentIndex].shortDesc=val; break;
        case 'description': products[currentIndex].description=val; break;
        case 'price': products[currentIndex].price=val||'Cena na upit'; break;
      }
    },300));
  });

  document.getElementById('price').addEventListener('input', e=>{
    let val = e.target.value.replace(/[^0-9.]/g,'');
    const parts = val.split('.');
    if(parts.length>2) val=parts[0]+'.'+parts[1];
    e.target.value = val;
  });

  // --- TAGS ---
  document.getElementById('tagContainer').addEventListener('click', e=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    document.querySelectorAll('#tagContainer button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    products[currentIndex].tag = btn.dataset.tag;
  });

  // --- SAVE & DELETE ---
  document.getElementById('saveBtn').addEventListener('click', ()=>saveProduct(currentIndex));
  document.getElementById('deleteBtn').addEventListener('click', ()=>deleteProduct(currentIndex));
}

// --- SHOW SPINNER ---
function showSpinner() {
  content.innerHTML = `
    <div class="flex justify-center items-center h-full">
      <div class="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16"></div>
    </div>
  `;
}

// --- SAVE PRODUCT ---
async function saveProduct(index){
  const p = products[index];
  const title = document.getElementById('title').value.trim();
  const shortDesc = document.getElementById('shortDesc').value.trim();
  const description = document.getElementById('description').value.trim();
  const specs = products[index].specs || {};
  const price = document.getElementById('price').value.trim() || 'Cena na upit';
  const tag = products[index].tag || '';
  const images = products[index].images || [];

  if(!title||!shortDesc||!description||!tag||images.length===0){
    Swal.fire({icon:'error', text:'Popunite sva polja!'}); return;
  }

  products[index] = {...p, title, shortDesc, description, specs, price, tag, images};

  const saveConfirm = document.getElementById('saveConfirm');
  saveConfirm.innerHTML = `<span class="spinner"></span> Čuvanje...`;
  saveConfirm.style.display='inline-flex';

  try{
    await fetch(`${API_URL}?id=${p.id}`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(products[index])
    });
    saveConfirm.innerHTML='✔ Sačuvano!';
    setTimeout(()=>saveConfirm.style.display='none',2000);
    renderSidebar();
  }catch(err){
    console.error(err); saveConfirm.style.display='none';
    Swal.fire({icon:'error', text:'Greška pri čuvanju!'});
  }
}

// --- DELETE PRODUCT ---
async function deleteProduct(index){
  if(index === null || !products[index]) return;
  const p = products[index];

  Swal.fire({
    title: 'Obrisati proizvod?',
    text: p.title || '',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Da',
    cancelButtonText: 'Otkaži'
  }).then(async result => {
    if(!result.isConfirmed) return;

    showSpinner();

    try {
      const res = await fetch(`${API_URL}?id=${p.id}`, {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'}
      });

      if(!res.ok) throw new Error(`Server returned ${res.status}`);

      products.splice(index, 1);

      if(products.length === 0){
        currentIndex = null;
        content.innerHTML = `<div class="text-center mt-20 text-gray-500 text-lg">
          Počnite sa dodavanjem novih proizvoda klikom na <strong>Novi proizvod</strong>.
        </div>`;
      } else {
        currentIndex = Math.min(index, products.length - 1);
        renderProductDetails(currentIndex);
      }

      renderSidebar();
      Swal.fire({icon:'success', text:'Proizvod obrisan!'});
    } catch(err) {
      console.error(err);
      content.innerHTML = `<div class="text-center mt-20 text-red-500 text-lg">Greška pri brisanju proizvoda.</div>`;
      Swal.fire({icon:'error', text:'Greška pri brisanju!'});
    }
  });
}

// --- ADD NOVI ---
addBtn.addEventListener('click', ()=>{
  const newProd = {
    id: crypto.randomUUID(),
    title: '',
    shortDesc: '',
    description: '',
    specs: {},
    price: '',
    tag: 'Novo',
    images: []
  };
  products.push(newProd);
  currentIndex = products.length - 1;
  renderSidebar();
  renderProductDetails(currentIndex);
});

// --- INIT ---
fetchProductsOptimized();

async function fetchProductsOptimized() {
  showSpinner();

  // clear old cache to avoid inconsistent formats
  localStorage.removeItem("products-cache");

  // fetch API
  let data;
  try {
    const res = await fetch(API_URL);
    data = await res.json();
  } catch(err) {
    console.error(err);
    content.innerHTML = `<div class="text-center mt-20 text-red-500 text-lg">
      Greška pri učitavanju proizvoda.
    </div>`;
    return;
  }

  // ensure array
  products = Array.isArray(data.products) ? data.products : [];
  localStorage.setItem("products-cache", JSON.stringify({ products }));

  if(products.length){
    currentIndex = 0;
    renderSidebar();
    renderProductDetails(0);
  } else {
    content.innerHTML = `<div class="text-center mt-20 text-gray-500 text-lg">
      Još nema proizvoda. Dodajte prvi preko <strong>+ Novi proizvod</strong>.
    </div>`;
  }
}
