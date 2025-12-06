const API_URL = 'https://products-api.sergej-kaldesic.workers.dev/';
let products = [];
let currentIndex = null;

// DOM elementi
const sidebar = document.getElementById('product-sidebar');
const content = document.getElementById('product-details');
const addBtn = document.getElementById('add-product-btn');

// FETCH proizvoda
async function fetchProducts() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    products = data.products || data;
    renderSidebar();
  } catch (err) {
    console.error(err);
    alert('Ne mogu da učitam proizvode.');
  }
}

// RENDER sidebar
function renderSidebar() {
  // Očisti sve osim "Add" dugmeta
  sidebar.querySelectorAll('button.product-tab').forEach(b => b.remove());

  products.forEach((p, i) => {
    const btn = document.createElement('button');
    btn.textContent = p.title || 'Bez naziva';
    btn.className = 'product-tab';
    if(i===currentIndex) btn.classList.add('active');
    btn.onclick = () => {
      currentIndex = i;
      renderSidebar();
      renderProductDetails(i);
    };
    sidebar.appendChild(btn);
  });
}

// RENDER detalja proizvoda
function renderProductDetails(index) {
  const p = products[index];
  content.innerHTML = `
    <div>
      <div class="input-field">
        <label class="block font-semibold">Naziv proizvoda</label>
        <input type="text" id="title" value="${p.title || ''}" class="w-full p-2 border rounded"/>
      </div>
      <div class="input-field">
        <label class="block font-semibold">Kratak opis</label>
        <input type="text" id="shortDesc" value="${p.shortDesc || ''}" class="w-full p-2 border rounded"/>
      </div>
      <div class="input-field">
        <label class="block font-semibold">Detaljan opis</label>
        <textarea id="description" class="w-full p-2 border rounded h-24">${p.description || ''}</textarea>
      </div>
      <div class="input-field">
        <label class="block font-semibold">Specifikacije</label>
        <textarea id="specs" class="w-full p-2 border rounded h-20">${p.specs ? p.specs.map(s=>`${s.label}:${s.value}`).join('\n') : ''}</textarea>
        <p class="text-sm text-gray-400 mt-1">Format: label:value po liniji</p>
      </div>
      <div class="input-field">
        <label class="block font-semibold">Cena</label>
        <input type="text" id="price" value="${p.price || ''}" class="w-full p-2 border rounded"/>
      </div>
      <div class="input-field">
        <label class="block font-semibold">Tag</label>
        <input type="text" id="tag" value="${p.tag || ''}" class="w-full p-2 border rounded"/>
      </div>
      <div class="input-field">
        <label class="block font-semibold">Slike</label>
        <input type="file" id="imageUpload" accept="image/*"/>
        <img id="imagePreview" src="${p.images?.[0] || ''}" class="product-image-preview"/>
      </div>
      <button id="saveBtn" class="bg-indigo-500 text-white px-4 py-2 rounded">Sačuvaj</button>
      <button id="deleteBtn" class="bg-red-500 text-white px-4 py-2 rounded ml-2">Obriši</button>
      <span class="save-confirm" id="saveConfirm">Sačuvano!</span>
    </div>
  `;

  // Upload slike preview
  const imgInput = document.getElementById('imageUpload');
  const imgPreview = document.getElementById('imagePreview');
  imgInput.onchange = e => {
    const file = e.target.files[0];
    if(file){
      const reader = new FileReader();
      reader.onload = ev => imgPreview.src = ev.target.result;
      reader.readAsDataURL(file);
    }
  };

  // Save dugme
  document.getElementById('saveBtn').onclick = () => saveProduct(index);

  // Delete dugme
  document.getElementById('deleteBtn').onclick = () => deleteProduct(index);
}

// SAVE proizvod
async function saveProduct(index){
  const p = products[index];
  const title = document.getElementById('title').value.trim();
  const shortDesc = document.getElementById('shortDesc').value.trim();
  const description = document.getElementById('description').value.trim();
  const specsText = document.getElementById('specs').value.trim();
  const price = document.getElementById('price').value.trim();
  const tag = document.getElementById('tag').value.trim();
  const imageSrc = document.getElementById('imagePreview').src;

  if(!title || !shortDesc || !description || !specsText || !price || !tag || !imageSrc){
    Swal.fire({icon:'error', text:'Popunite sva polja!'}); return;
  }

  const specs = specsText.split('\n').map(line=>{
    const [label,value] = line.split(':'); 
    return { label: label?.trim() || '', value: value?.trim() || '' };
  });

  products[index] = { ...p, title, shortDesc, description, specs, price, tag, images:[imageSrc] };

  try{
    await fetch(API_URL, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({products})
    });
    document.getElementById('saveConfirm').style.display='inline';
    setTimeout(()=>document.getElementById('saveConfirm').style.display='none',2000);
    renderSidebar();
  }catch(err){
    console.error(err);
    Swal.fire({icon:'error', text:'Greška pri čuvanju!'});
  }
}

// DELETE proizvod
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
        await fetch(API_URL, {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({products})
        });
        currentIndex = null;
        content.innerHTML = '<p class="text-gray-500">Izaberi proizvod sa leve strane ili kreiraj novi.</p>';
        renderSidebar();
      }catch(err){
        console.error(err);
        Swal.fire({icon:'error', text:'Greška pri brisanju!'});
      }
    }
  });
}

// ADD novi proizvod
addBtn.onclick = ()=>{
  const newProd = { title:'', shortDesc:'', description:'', specs:[], price:'', tag:'', images:[] };
  products.push(newProd);
  currentIndex = products.length-1;
  renderSidebar();
  renderProductDetails(currentIndex);
}

// INIT
fetchProducts();
