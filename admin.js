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
      updateActiveSidebar();
      renderProductDetails(currentIndex);
    });
    sidebar.appendChild(btn);
  });
}

function updateActiveSidebar() {
  const buttons = sidebar.querySelectorAll('.product-tab');
  buttons.forEach((btn, idx) => btn.classList.toggle('active', idx === currentIndex));
}

// --- RENDER DETALJA ---
function renderProductDetails(index) {
  if(index === null || !products[index]) return;
  const p = products[index];

  const fixedSpecs = ['CPU','RAM','GPU','Memorija','Ekran','Baterija','OS','Težina','Dimenzije','Portovi','Bežične konekcije','Kamera','Audio'];
  if(!p.specs) p.specs = {};
  fixedSpecs.forEach(label => { if(!(label in p.specs)) p.specs[label]=''; });

  // --- HTML SAMO JEDNOM ---
  if(!content.dataset.rendered){
    content.innerHTML = `
      <div class="grid grid-cols-3 gap-6">
        <div class="col-span-2 space-y-6">
          <header class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-8 py-4 bg-white dark:bg-slate-900 sticky top-0 z-10">
            <h2 id="productHeader" class="text-slate-900 dark:text-white text-lg font-bold"></h2>
          </header>

          <div class="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-4">Product Details</h3>
            <div class="space-y-4">
              <div>
                <label for="title" class="text-sm font-medium text-slate-700 dark:text-slate-300">Naziv proizvoda</label>
                <input id="title" type="text"/>
              </div>
              <div>
                <label for="shortDesc" class="text-sm font-medium text-slate-700 dark:text-slate-300">Kratak opis</label>
                <input id="shortDesc" type="text"/>
              </div>
              <div>
                <label for="description" class="text-sm font-medium text-slate-700 dark:text-slate-300">Detaljan opis</label>
                <textarea id="description" rows="5"></textarea>
              </div>
            </div>
          </div>

          <div class="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-4">Specifikacije</h3>
            <div id="specsContainer" class="space-y-2"></div>
          </div>
        </div>

        <div class="col-span-1 space-y-6">
          <div class="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-2">Slike</h3>
            <div class="mb-2 text-sm text-slate-600 dark:text-slate-400" id="imageCount"></div>
            <div id="imageCarousel" class="flex gap-2 overflow-x-auto pb-2"></div>
            <div>
              <button id="imageUpload" class="w-full py-2 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary hover:text-primary text-slate-500 dark:text-slate-400">+ Nova fotografija</button>
            </div>
          </div>

          <div class="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-4">Cena €</h3>
            <input id="price" type="text"/>
          </div>

          <div class="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-4">Tagovi</h3>
            <div id="tagContainer" class="flex flex-wrap gap-2"></div>
          </div>

          <div class="flex gap-2">
            <button id="saveBtn" class="bg-indigo-500 text-white px-4 py-2 rounded-lg flex-1">Sačuvaj</button>
            <button id="deleteBtn" class="bg-red-500 text-white px-4 py-2 rounded-lg flex-1">Obriši</button>
          </div>
          <span class="save-confirm" id="saveConfirm">Sačuvano!</span>
        </div>
      </div>
    `;
    content.dataset.rendered = "true";

    // --- EVENT LISTENERS --- 
    setupInputs();
    setupTags();
    setupImageUpload();
    document.getElementById('saveBtn').addEventListener('click', ()=>saveProduct(currentIndex));
    document.getElementById('deleteBtn').addEventListener('click', ()=>deleteProduct(currentIndex));
  }

  // --- POPUNJAVANJE PODATAKA ---
  document.getElementById('productHeader').textContent = `Detalji proizvoda: ${p.title||''}`;
  document.getElementById('title').value = p.title||'';
  document.getElementById('shortDesc').value = p.shortDesc||'';
  document.getElementById('description').value = p.description||'';
  document.getElementById('price').value = p.price==='Cena na upit'?'':p.price;

  // Specs
  const specsContainer = document.getElementById('specsContainer');
  specsContainer.innerHTML = '';
  Object.keys(p.specs).forEach(label => {
    const div = document.createElement('div');
    div.className='flex gap-2 items-center';
    div.innerHTML = `
      <span class="spec-label flex-1 font-semibold">${label}</span>
      <input type="text" class="spec-value flex-1 rounded-lg border p-1" value="${p.specs[label]}"/>
    `;
    const input = div.querySelector('input');
    input.addEventListener('input', debounce(e=>{
      products[currentIndex].specs[label]=e.target.value.trim();
    },300));
    specsContainer.appendChild(div);
  });

  // Slike
  const carousel = document.getElementById('imageCarousel');
  carousel.innerHTML = '';
  p.images.forEach((src,i)=>{
    const wrapper = document.createElement('div');
    wrapper.className = 'relative flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700';
    wrapper.innerHTML = `
      <img src="${src}" class="w-full h-full object-cover">
      <button class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs" data-index="${i}" title="Obriši sliku">×</button>
    `;
    wrapper.querySelector('button').addEventListener('click', ()=>{
      products[currentIndex].images.splice(i,1);
      renderProductDetails(currentIndex);
    });
    carousel.appendChild(wrapper);
  });
  document.getElementById('imageCount').textContent = `Trenutni broj slika: ${p.images.length}`;

  // Tagovi
  const tagContainer = document.getElementById('tagContainer');
  tagContainer.innerHTML = '';
  TAGS.forEach(tag=>{
    const btn = document.createElement('button');
    btn.type='button';
    btn.dataset.tag=tag;
    btn.className=`tag-btn px-3 py-1 rounded-lg ${tag===p.tag?'active':''}`;
    btn.textContent = tag;
    btn.addEventListener('click', ()=>{
      TAGS.forEach(t=>tagContainer.querySelector(`[data-tag="${t}"]`)?.classList.remove('active'));
      btn.classList.add('active');
      products[currentIndex].tag = tag;
    });
    tagContainer.appendChild(btn);
  });
}

// --- INPUTS ---
function setupInputs(){
  ['title','shortDesc','description','price'].forEach(id=>{
    const el = document.getElementById(id);
    el.addEventListener('input', debounce(()=>{
      if(currentIndex===null) return;
      const val = el.value.trim();
      switch(id){
        case 'title': products[currentIndex].title=val; break;
        case 'shortDesc': products[currentIndex].shortDesc=val; break;
        case 'description': products[currentIndex].description=val; break;
        case 'price': products[currentIndex].price=val||'Cena na upit'; break;
      }
    },300));
  });
  // Price cleanup
  document.getElementById('price').addEventListener('input', e=>{
    let val = e.target.value.replace(/[^0-9.]/g,'');
    const parts = val.split('.');
    if(parts.length>2) val=parts[0]+'.'+parts[1];
    e.target.value = val;
  });
}

// --- TAGS ---
function setupTags(){
  // handled inside renderProductDetails
}

// --- IMAGE UPLOAD ---
function setupImageUpload(){
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
      let loaded = 0;
      files.forEach(file=>{
        const reader = new FileReader();
        reader.onload = ev=>{
          if(!products[currentIndex].images) products[currentIndex].images=[];
          products[currentIndex].images.push(ev.target.result);
          loaded++;
          if(loaded===files.length){
            renderProductDetails(currentIndex); // batch update jednom
          }
        };
        reader.readAsDataURL(file);
      });
    });
  });
}

// --- SAVE OPTIMIZED ---
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
    Swal.fire({icon:'error', text:'Popunite sva polja!'}); 
    return;
  }

  // Update lokalno
  products[index] = {...p, title, shortDesc, description, specs, price, tag, images};

  const saveConfirm = document.getElementById('saveConfirm');
  saveConfirm.innerHTML = `<span class="spinner"></span> Čuvanje...`;
  saveConfirm.style.display='inline-flex';

  try{
    // Šaljemo samo ovaj proizvod
    await fetch(`${API_URL}?id=${p.id}`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(products[index])
    });
    saveConfirm.innerHTML='✔ Sačuvano!';
    setTimeout(()=>saveConfirm.style.display='none',2000);
    renderSidebar();
  }catch(err){
    console.error(err); 
    saveConfirm.style.display='none';
    Swal.fire({icon:'error', text:'Greška pri čuvanju!'});
  }
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
fetchProducts();

async function fetchProducts() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    products = data.products || data;
    renderSidebar();
  } catch(err) {
    console.error(err);
    alert('Ne mogu da učitam proizvode.');
  }
}
