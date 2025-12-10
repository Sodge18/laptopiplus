function debounce(fn, delay=300){
  let timer;
  return function(...args){
    clearTimeout(timer);
    timer = setTimeout(()=>fn.apply(this, args), delay);
  };
}

const API_URL = 'https://products-api.sergej-kaldesic.workers.dev/';
let products = [];
let currentIndex = null;

const sidebar = document.getElementById('product-sidebar');
const content = document.getElementById('product-details');
const addBtn = document.getElementById('add-product-btn');

const TAGS = ['Novo', 'Poslovni', 'Gamer', 'Premium'];

// --- FETCH proizvoda ---
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

// --- SIDEBAR ---
function renderSidebar() {
  sidebar.querySelectorAll('button.product-tab').forEach(b => b.remove());
  products.forEach((p, i) => {
    const btn = document.createElement('button');
    btn.textContent = p.title || 'Bez naziva';
    btn.className = 'product-tab';
    if(i === currentIndex) btn.classList.add('active');
    btn.addEventListener('click', () => {
      currentIndex = i;
      updateActiveSidebarButton();
      renderProductDetails(currentIndex);
    });
    sidebar.appendChild(btn);
  });
}

// --- UPDATE ACTIVE BUTTON ---
function updateActiveSidebarButton() {
  sidebar.querySelectorAll('button.product-tab').forEach(btn => btn.classList.remove('active'));
  if(currentIndex !== null){
    const btns = sidebar.querySelectorAll('button.product-tab');
    if(btns[currentIndex]) btns[currentIndex].classList.add('active');
  }
}

// --- RENDER DETALJA ---
function renderProductDetails(index) {
  const p = products[index];
  content.innerHTML = `
    <div class="grid grid-cols-3 gap-8">
      <!-- Lijeva strana: Detalji i Specifikacije -->
      <div class="col-span-2 space-y-6">
        <div class="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-4">Product Details</h3>
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300" for="title">Naziv proizvoda</label>
              <input id="title" type="text" class="mt-1 block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-primary focus:ring-primary dark:text-white" value="${p.title||''}"/>
            </div>
            <div>
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300" for="shortDesc">Kratak opis</label>
              <input id="shortDesc" type="text" class="mt-1 block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-primary focus:ring-primary dark:text-white" value="${p.shortDesc||''}"/>
            </div>
            <div>
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300" for="description">Detaljan opis</label>
              <textarea id="description" rows="5" class="mt-1 block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-primary focus:ring-primary dark:text-white">${p.description||''}</textarea>
            </div>
          </div>
        </div>
        <div class="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-4">Specifikacije</h3>
          <textarea id="specs" class="mt-1 block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-primary focus:ring-primary dark:text-white h-20">${p.specs.map(s=>`${s.label}:${s.value}`).join('\n')}</textarea>
        </div>
      </div>

      <!-- Desna strana: Slike, Cena i Tagovi -->
      <div class="col-span-1 space-y-6">
        <!-- Slike -->
        <div class="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-4">Slike</h3>
          <div class="grid grid-cols-2 gap-4">
            ${(p.images||[]).map(src=>`<img src="${src}" class="aspect-square w-full rounded-lg object-cover">`).join('')}
            <div class="flex aspect-square w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary hover:text-primary transition-colors text-slate-500 dark:text-slate-400">
              <div class="text-center">
                <span class="material-symbols-outlined text-4xl">upload</span>
                <p class="mt-1 text-sm">Upload Image</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Cijena -->
        <div class="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-4">Cena €</h3>
          <input id="price" type="text" class="mt-1 block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-primary focus:ring-primary dark:text-white" value="${p.price==='Cena na upit'?'':p.price}" placeholder="0.00"/>
        </div>

        <!-- Tagovi -->
        <div class="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-4">Tagovi</h3>
          <div id="tagContainer" class="flex flex-wrap gap-2">
            ${TAGS.map(tag => `<button type="button" data-tag="${tag}" class="tag-btn px-3 py-1 rounded-lg ${tag===p.tag?'active':''}">${tag}</button>`).join('')}
          </div>
        </div>

        <!-- Save i Delete -->
        <div class="flex gap-2">
          <button id="saveBtn" class="bg-indigo-500 text-white px-4 py-2 rounded-lg flex-1">Sačuvaj</button>
          <button id="deleteBtn" class="bg-red-500 text-white px-4 py-2 rounded-lg flex-1">Obriši</button>
        </div>
        <span class="save-confirm" id="saveConfirm">Sačuvano!</span>
      </div>
    </div>
  `;

  // --- INPUTS ---
  ['title','shortDesc','description','specs','price'].forEach(id=>{
    document.getElementById(id).addEventListener('input', debounce(()=>{
      if(currentIndex===null) return;
      const val = document.getElementById(id).value.trim();
      switch(id){
        case 'title': products[currentIndex].title=val; break;
        case 'shortDesc': products[currentIndex].shortDesc=val; break;
        case 'description': products[currentIndex].description=val; break;
        case 'specs':
          products[currentIndex].specs = val.split('\n').map(line=>{
            const [label,...rest]=line.split(':');
            return {label:label?.trim()||'', value:rest.join(':').trim()||''};
          });
          break;
        case 'price': products[currentIndex].price=val||'Cena na upit'; break;
      }
    },300));
  });

  // --- PRICE INPUT FILTER ---
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

  // --- IMAGE UPLOAD ---
  const imgInput = document.getElementById('imageUpload');
  const imgContainer = document.getElementById('imagePreviewContainer');
  imgInput.addEventListener('change', e=>{
    const files = [...e.target.files];
    if(files.length + (products[currentIndex].images?.length||0) > 30){ 
      Swal.fire({icon:'error', text:'Maksimalno 30 slika!'}); 
      return; 
    }
    files.forEach(file=>{
      const reader = new FileReader();
      reader.onload = ev=>{
        const img = document.createElement('img');
        img.src = ev.target.result;
        img.className='product-image-preview';
        imgContainer.appendChild(img);
        if(!products[currentIndex].images) products[currentIndex].images=[];
        products[currentIndex].images.push(ev.target.result);
      };
      reader.readAsDataURL(file);
    });
    e.target.value='';
  });

  // --- SAVE ---
  document.getElementById('saveBtn').addEventListener('click', ()=>saveProduct(currentIndex));

  // --- DELETE ---
  document.getElementById('deleteBtn').addEventListener('click', ()=>deleteProduct(currentIndex));
}

// --- SAVE FUNCTION ---
async function saveProduct(index){
  const p = products[index];
  const title = document.getElementById('title').value.trim();
  const shortDesc = document.getElementById('shortDesc').value.trim();
  const description = document.getElementById('description').value.trim();
  const specs = document.getElementById('specs').value.trim().split('\n').map(line=>{
    const [label,...rest]=line.split(':');
    return {label:label?.trim()||'', value:rest.join(':').trim()||''};
  });
  const price = document.getElementById('price').value.trim() || 'Cena na upit';
  const tag = document.getElementById('tagContainer').querySelector('.active')?.dataset.tag || '';
  const images = products[index].images || [];

  if(!title||!shortDesc||!description||!specs||!tag||images.length===0){
    Swal.fire({icon:'error', text:'Popunite sva polja!'}); return;
  }

  products[index] = {...p, title, shortDesc, description, specs, price, tag, images};

  const saveConfirm = document.getElementById('saveConfirm');
  saveConfirm.innerHTML = `<span class="spinner"></span> Čuvanje...`;
  saveConfirm.style.display='inline-flex';

  try{
    await fetch(API_URL,{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({products})});
    saveConfirm.innerHTML='✔ Sačuvano!';
    setTimeout(()=>saveConfirm.style.display='none',2000);
    renderSidebar();
  }catch(err){
    console.error(err); saveConfirm.style.display='none';
    Swal.fire({icon:'error', text:'Greška pri čuvanju!'});
  }
}

// --- DELETE FUNCTION ---
async function deleteProduct(index){
  Swal.fire({
    title:'Obrisati proizvod?', 
    text: products[index].title || '',
    icon:'warning', 
    showCancelButton:true, 
    confirmButtonText:'Da', 
    cancelButtonText:'Otkaži'
  }).then(async result=>{
    if(result.isConfirmed){
      products.splice(index,1);
      try{
        await fetch(API_URL,{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({products})});
        currentIndex=null;
        content.innerHTML = `<div class="text-center mt-20 text-gray-500 text-lg">Počnite sa dodavanjem novih proizvoda klikom na <strong>+ Novi proizvod</strong>.</div>`;
        renderSidebar();
      }catch(err){
        console.error(err);
        Swal.fire({icon:'error', text:'Greška pri brisanju!'});
      }
    }
  });
}

// --- ADD NOVI ---
addBtn.addEventListener('click', ()=>{
  const newProd = {title:'', shortDesc:'', description:'', specs:[], price:'', tag:'Novo', images:[]};
  products.push(newProd);
  currentIndex=products.length-1;
  renderSidebar();
  renderProductDetails(currentIndex);
});

// --- INIT ---
fetchProducts();
