/* ============================================================
   script.js — Lifa Flora E-Commerce (FIXED VERSION)
   ============================================================ */

const STORAGE_PRODUCTS_KEY = "lifaFloraProducts";
const STORAGE_ORDERS_KEY = "lifaFloraOrders";
const STORAGE_USERS_KEY = "lifaFloraUsers";
const STORAGE_SESSION_KEY = "lifaFloraSession";
const STORAGE_CART_PERSIST_KEY = "lifaFloraCartPersist";
const STORAGE_LAST_ORDER_KEY = "lifaFloraLastOrder";

/* ---------- Auth helpers ---------- */
function getSession() {
  try { return JSON.parse(localStorage.getItem(STORAGE_SESSION_KEY)); } catch { return null; }
}
function setSession(s) { localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(s)); }
function clearSession() { localStorage.removeItem(STORAGE_SESSION_KEY); }

function getUsers() {
  try { return JSON.parse(localStorage.getItem(STORAGE_USERS_KEY)) || []; } catch { return []; }
}
function saveUsers(u) { localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(u)); }

function logoutUser() {
  clearSession();
  updateNavAuth();
  showToast("👋 Berhasil keluar.");
}

function updateNavAuth() {
  const session = getSession();
  const loginItem = document.getElementById("navLoginItem");
  const userItem = document.getElementById("navUserItem");
  const userName = document.getElementById("navUserName");
  if (!loginItem || !userItem) return;
  if (session && session.nama) {
    loginItem.style.display = "none";
    userItem.style.display = "flex";
    if (userName) userName.textContent = "👤 " + session.nama;
  } else {
    loginItem.style.display = "";
    userItem.style.display = "none";
  }
}

/* ---------- Order persistence ---------- */
function getLastOrder() {
  try { return JSON.parse(localStorage.getItem(STORAGE_LAST_ORDER_KEY)); } catch { return null; }
}
function saveLastOrder(o) { localStorage.setItem(STORAGE_LAST_ORDER_KEY, JSON.stringify(o)); }

function getAllOrders() {
  try { return JSON.parse(localStorage.getItem("lifaFloraAllOrders")) || []; } catch { return []; }
}
function saveAllOrders(arr) { localStorage.setItem("lifaFloraAllOrders", JSON.stringify(arr)); }

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("id-ID", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
}

const defaultProducts = [
  { id:1, name:"Rose Elegance", price:185000, emoji:"🌹", image:"images/rose.jpg", desc:"Buket mawar merah premium, cocok untuk anniversary atau ungkapan cinta.", category:"anniversary", hot:true, stock: 8 },
  { id:2, name:"Cherry Blossom Dream", price:165000, emoji:"🌸", image:"images/chery blosoom.jpeg", desc:"Buket bunga sakura pastel lembut, tampilan aesthetic dan romantis.", category:"ulang tahun", hot:false, stock: 10 },
  { id:3, name:"Sunflower Glow", price:145000, emoji:"🌻", image:"images/sunflower glow.jpeg", desc:"Buket bunga matahari ceria, cocok untuk teman wisuda atau hadiah.", category:"wisuda", hot:true, stock: 12 },
  { id:4, name:"Pastel Tulip", price:175000, emoji:"🌷", image:"images/pastel tulip.jpeg", desc:"Buket tulip warna pastel campuran, elegan dan modern.", category:"anniversary", hot:false, stock: 9 },
  { id:5, name:"Mix Garden", price:210000, emoji:"💐", image:"images/mix garden.jpeg", desc:"Buket campur berbagai bunga segar pilihan, tampil mewah dan penuh warna.", category:"ulang tahun", hot:true, stock: 6 },
  { id:6, name:"Wisuda Prestasi", price:155000, emoji:"🎓", image:"images/wisuda.jpeg", desc:"Spesial untuk wisudawan, dikemas dengan pita emas dan ucapan selamat.", category:"wisuda", hot:false, stock: 11 },
  { id:7, name:"Lavender Kiss", price:195000, emoji:"💜", image:"images/lavender kiss.jpeg", desc:"Buket lavender ungu memikat, aromaterapi alami dan visual cantik.", category:"custom", hot:false, stock: 7 },
  { id:8, name:"White Lily Pure", price:225000, emoji:"🤍", image:"images/white lili.jpeg", desc:"Buket lily putih bersih dan mewah, cocok untuk acara formal dan pernikahan.", category:"custom", hot:true, stock: 5 }
];

let products = [];
let cart = [];
let orders = [];
let currentFilter = "semua";
let searchQuery = "";
let appliedVoucher = null;

function saveState() {
  localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(products));
  localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders));
  localStorage.setItem(STORAGE_CART_PERSIST_KEY, JSON.stringify(cart));
}

function loadState() {
  const storedProducts = localStorage.getItem(STORAGE_PRODUCTS_KEY);
  const storedOrders   = localStorage.getItem(STORAGE_ORDERS_KEY);
  const storedCart     = localStorage.getItem(STORAGE_CART_PERSIST_KEY);
  products = storedProducts ? JSON.parse(storedProducts) : [...defaultProducts];
  orders   = storedOrders   ? JSON.parse(storedOrders)   : [];
  cart     = storedCart     ? JSON.parse(storedCart)     : [];
  if (!Array.isArray(products)) products = [...defaultProducts];
  if (!Array.isArray(orders))   orders   = [];
  if (!Array.isArray(cart))     cart     = [];
}

const vouchers = {
  LIFA10: { value: 10, maxDiscount: 50000 }
};

function formatPrice(num) {
  return "Rp " + num.toLocaleString("id-ID");
}

function getFilteredProducts(filter = currentFilter) {
  const categoryFiltered = filter === "semua"
    ? products
    : products.filter(product => product.category === filter);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  if (!normalizedQuery) return categoryFiltered;

  return categoryFiltered.filter(product => {
    const haystack = `${product.name} ${product.desc} ${product.category} ${product.emoji}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

function renderProducts(filter = "semua") {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;
  grid.innerHTML = "";
  const filtered = getFilteredProducts(filter);
  filtered.forEach((product, index) => {
    const stockCount = Number(product.stock || 0);
    const inStock = stockCount > 0;
    const stockLabel = inStock ? `${stockCount} tersisa` : `Stok habis`;
    const card = document.createElement("div");
    card.className = "product-card";
    card.style.animationDelay = `${index * 0.07}s`;
    card.innerHTML = `
      <div class="product-img-wrapper">
        ${product.image
          ? `<img src="${product.image}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
             <div class="product-emoji" style="display:none">${product.emoji}</div>`
          : `<div class="product-emoji">${product.emoji}</div>`}
        <span class="product-badge">${capitalizeFirst(product.category)}</span>
        ${product.hot ? '<span class="product-badge badge-hot">🔥 Terlaris</span>' : ""}
      </div>
      <div class="product-info">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-desc">${product.desc}</p>
        <div class="product-stock">${stockLabel}</div>
        <div class="product-footer">
          <span class="product-price">${formatPrice(product.price)}</span>
          <button class="add-cart-btn" onclick="addToCart(${product.id})" ${inStock ? "" : "disabled"}>+ Keranjang</button>
        </div>
      </div>`;
    grid.appendChild(card);
  });
  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-light);"><div style="font-size:3rem;margin-bottom:1rem">🌿</div><p>Belum ada produk dalam kategori ini.</p></div>`;
  }
}

function recordOrder(orderData) {
  orders.push(orderData);
  saveState();
}

function capitalizeFirst(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

function filterProducts(category, btn) {
  currentFilter = category;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  if (btn) {
    btn.classList.add("active");
  } else {
    const matchedBtn = document.querySelector(`.filter-btn[data-category="${category}"]`);
    if (matchedBtn) matchedBtn.classList.add("active");
  }
  renderProducts(category);
}

function openCategory(category) {
  filterProducts(category);
  const productsSection = document.getElementById("products");
  if (productsSection) {
    const navbarHeight = document.querySelector(".navbar")?.offsetHeight || 0;
    const topPosition = productsSection.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 16;
    window.scrollTo({ top: topPosition, behavior: "smooth" });
  }
}

function handleProductSearch(event) {
  searchQuery = event.target.value;
  renderProducts(currentFilter);
}

function submitProductSearch() {
  const input = document.getElementById("productSearch");
  if (input) {
    searchQuery = input.value;
    renderProducts(currentFilter);
    input.focus();
  }
}

function createPetalBurst(x, y) {
  const colors = ["#F4A7B9", "#E8758F", "#B5D5C5", "#FFFFFF"];
  const petals = 16;

  for (let i = 0; i < petals; i += 1) {
    const petal = document.createElement("span");
    petal.className = "petal-burst";
    petal.style.left = `${x}px`;
    petal.style.top = `${y}px`;
    petal.style.background = colors[i % colors.length];
    petal.style.setProperty("--tx", `${(Math.random() - 0.5) * 120}px`);
    petal.style.setProperty("--ty", `${(Math.random() - 0.5) * 140 - 70}px`);
    petal.style.setProperty("--rot", `${Math.random() * 360}deg`);
    document.body.appendChild(petal);
    setTimeout(() => petal.remove(), 1200);
  }
}

function addToCart(productId) {
  const normalizedId = Number(productId);
  const product = products.find(p => Number(p.id) === normalizedId);
  if (!product) return;

  const existingItem = cart.find(item => Number(item.id) === normalizedId);
  const currentQty = existingItem ? existingItem.qty : 0;
  if (currentQty + 1 > product.stock) {
    showToast("⚠️ Stok produk tidak mencukupi.");
    return;
  }

  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, emoji: product.emoji, qty: 1 });
  }

  const button = document.querySelector(`button[onclick="addToCart(${product.id})"]`);
  if (button) {
    const rect = button.getBoundingClientRect();
    createPetalBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  updateCartUI();
  showToast(`🌸 "${product.name}" ditambahkan ke keranjang!`);
}

function changeQty(productId, delta) {
  const normalizedId = Number(productId);
  const item = cart.find(i => Number(i.id) === normalizedId);
  if (!item) return;

  const product = products.find(p => p.id === normalizedId);
  if (delta > 0 && product && item.qty + delta > Number(product.stock || 0)) {
    showToast("⚠️ Tidak bisa menambah. Stok produk terbatas.");
    return;
  }

  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => Number(i.id) !== normalizedId);
  updateCartUI();
}

function removeFromCart(productId) {
  const normalizedId = Number(productId);
  cart = cart.filter(i => Number(i.id) !== normalizedId);
  updateCartUI();
  showToast("❌ Item dihapus dari keranjang.");
}

function clearCart() {
  if (cart.length === 0) return;
  showConfirmModal("Kosongkan Keranjang?", "Semua item akan dihapus dari keranjang.", () => {
    cart = [];
    updateCartUI();
    showToast("🗑️ Keranjang dikosongkan.");
  });
}

function getCartSummary() {
  const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);
  const totalItems = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  let discount = 0;

  if (appliedVoucher && subtotal > 0 && totalItems >= 2) {
    const voucher = vouchers[appliedVoucher.code];
    if (voucher) {
      discount = Math.min(subtotal * (voucher.value / 100), voucher.maxDiscount || subtotal);
    }
  }

  return {
    subtotal,
    discount,
    total: Math.max(0, subtotal - discount),
    totalItems
  };
}

function renderVoucherStatus() {
  const statusEl = document.getElementById("voucherStatus");
  if (!statusEl) return;

  if (!appliedVoucher) {
    statusEl.textContent = "Masukkan kode voucher untuk dapat diskon.";
    statusEl.className = "voucher-status";
    return;
  }

  const summary = getCartSummary();
  if (summary.totalItems < 2) {
    statusEl.innerHTML = `<span class="voucher-status-text">Voucher ${appliedVoucher.code} hanya berlaku untuk minimal 2 produk.</span>`;
    statusEl.className = "voucher-status";
    return;
  }

  statusEl.innerHTML = `<span class="voucher-status-text success">Voucher ${appliedVoucher.code} aktif • diskon ${formatPrice(summary.discount)}</span>`;
  statusEl.className = "voucher-status voucher-status--success";
}

function applyVoucher() {
  const input = document.getElementById("voucherInput");
  const code = input?.value.trim().toUpperCase();

  if (!code) {
    showToast("⚠️ Masukkan kode voucher terlebih dahulu.");
    return;
  }

  if (!vouchers[code]) {
    appliedVoucher = null;
    renderVoucherStatus();
    showToast("❌ Kode voucher tidak valid. Gunakan LIFA10.");
    return;
  }

  if (cart.reduce((sum, item) => sum + Number(item.qty || 0), 0) < 2) {
    appliedVoucher = null;
    renderVoucherStatus();
    showToast("⚠️ Voucher hanya bisa dipakai saat keranjang minimal 2 produk.");
    return;
  }

  appliedVoucher = { code };
  renderVoucherStatus();
  updateCartUI();
  showToast(`🎟️ Voucher ${code} berhasil diterapkan.`);
}

function updateCartUI() {
  cart = cart.filter(item => item && Number(item.qty) > 0);
  // Simpan cart ke localStorage agar tersedia di halaman checkout
  localStorage.setItem(STORAGE_CART_PERSIST_KEY, JSON.stringify(cart));

  const totalItems = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const summary = getCartSummary();
  const countEl = document.getElementById("cartCount");
  if (countEl) {
    countEl.textContent = totalItems > 0 ? totalItems : "0";
    countEl.style.display = totalItems > 0 ? "flex" : "none";
  }

  const cartItemsEl  = document.getElementById("cartItems");
  const cartEmptyEl  = document.getElementById("cartEmpty");
  const cartFooterEl = document.getElementById("cartFooter");
  const subtotalEl   = document.getElementById("subtotalPrice");
  const discountEl    = document.getElementById("discountPrice");
  const totalEl      = document.getElementById("totalPrice");

  if (cart.length === 0) {
    if (cartItemsEl) cartItemsEl.innerHTML = "";
    if (cartEmptyEl) cartEmptyEl.style.display = "flex";
    if (cartItemsEl && cartEmptyEl) cartItemsEl.appendChild(cartEmptyEl);
    if (cartFooterEl) cartFooterEl.style.display = "none";
    if (subtotalEl) subtotalEl.textContent = formatPrice(0);
    if (discountEl) discountEl.textContent = "-" + formatPrice(0);
    if (totalEl) totalEl.textContent = formatPrice(0);
    renderVoucherStatus();
    return;
  }

  if (cartEmptyEl) cartEmptyEl.style.display = "none";
  if (cartFooterEl) cartFooterEl.style.display = "block";
  if (cartItemsEl) cartItemsEl.innerHTML = "";
  cart.forEach(item => {
    const el = document.createElement("div");
    el.className = "cart-item";
    el.innerHTML = `
      <div class="cart-item-emoji">${item.emoji}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${formatPrice(item.price * item.qty)}</div>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" data-action="minus" data-id="${item.id}">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" data-action="plus" data-id="${item.id}">+</button>
        <button class="cart-remove" data-action="remove" data-id="${item.id}">✕</button>
      </div>`;
    if (cartItemsEl) cartItemsEl.appendChild(el);
  });
  if (cartItemsEl) {
    cartItemsEl.querySelectorAll("button[data-action]").forEach(btn => {
    btn.addEventListener("click", function () {
      const id = parseInt(this.dataset.id);
      const action = this.dataset.action;
      if (action === "minus")  changeQty(id, -1);
      if (action === "plus")   changeQty(id, +1);
      if (action === "remove") removeFromCart(id);
    });
    });
  }
  if (subtotalEl) subtotalEl.textContent = formatPrice(summary.subtotal);
  if (discountEl) discountEl.textContent = `-${formatPrice(summary.discount)}`;
  if (totalEl) totalEl.textContent = formatPrice(summary.total);
  renderVoucherStatus();
}

function toggleCart() {
  const sidebar = document.getElementById("cartSidebar");
  const overlay = document.getElementById("cartOverlay");
  sidebar.classList.toggle("open");
  overlay.classList.toggle("open");
  document.body.style.overflow = sidebar.classList.contains("open") ? "hidden" : "";
}

function checkout() {
  if (cart.length === 0) { showToast("❗ Keranjangmu masih kosong!"); return; }

  const summary = getCartSummary();
  const itemsHTML = cart.map(item => `
    <div class="receipt-item">
      <span class="receipt-emoji">${item.emoji}</span>
      <div class="receipt-item-info">
        <span class="receipt-name">${item.name}</span>
        <span class="receipt-qty">x${item.qty}</span>
      </div>
      <span class="receipt-price">${formatPrice(item.price * item.qty)}</span>
    </div>`).join("");
  const itemsText = cart.map(item => `- ${item.name} x${item.qty} (${formatPrice(item.price * item.qty)})`).join("\n");
  const now = new Date();
  const tgl = now.toLocaleDateString("id-ID", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
  const jam = now.toLocaleTimeString("id-ID", { hour:"2-digit", minute:"2-digit" });
  const orderNum = "LF" + Date.now().toString().slice(-6);

  showPaymentModal({ orderNum, tgl, jam, subtotalPrice: summary.subtotal, discountPrice: summary.discount, totalPrice: summary.total, itemsHTML, itemsText });
}

function showPaymentModal(orderData) {
  let overlay = document.getElementById("paymentOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "paymentOverlay";
    overlay.className = "receipt-overlay";
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div class="receipt-box payment-modal">
      <div class="receipt-header">
        <div class="receipt-flower">🏦</div>
        <h2>Pembayaran</h2>
        <p>Silakan transfer sesuai total pesananmu</p>
      </div>
      <div class="payment-card">
        <p class="payment-label">Transfer ke</p>
        <h3>SeaBank</h3>
        <div class="payment-account">
          <span>No. Rekening</span>
          <strong>901809290073</strong>
        </div>
        <p class="payment-note">Nominal transfer sesuai total pesanan. Untuk setiap pembayaran non-COD, wajib melampirkan transaksi atau bukti pembayaran dan alamat lengkap untuk pengiriman.</p>
      </div>
      <div class="payment-card">
        <p class="payment-label">Biodata</p>
        <div class="payment-field">
          <label for="customerName">Nama Lengkap</label>
          <input type="text" id="customerName" class="payment-input" placeholder="Masukkan nama lengkap Anda" />
        </div>
        <div class="payment-field">
          <label for="customerPhone">Nomor Telepon</label>
          <input type="tel" id="customerPhone" class="payment-input" placeholder="Masukkan nomor telepon Anda" />
        </div>
        <div class="payment-field">
          <label for="customerAddress">Alamat Lengkap</label>
          <textarea id="customerAddress" class="payment-input payment-textarea" rows="3" placeholder="Masukkan alamat lengkap untuk pengiriman"></textarea>
        </div>
      </div>
      <div class="receipt-divider">— Ringkasan Pesanan —</div>
      <div class="receipt-items">${orderData.itemsHTML}</div>
      <div class="receipt-summary">
        <div class="receipt-row"><span>Subtotal</span><span>${formatPrice(orderData.subtotalPrice)}</span></div>
        <div class="receipt-row"><span>Diskon</span><span class="discount-green">-${formatPrice(orderData.discountPrice)}</span></div>
        <div class="receipt-row"><span>Ongkir</span><span class="free-green">✓ GRATIS</span></div>
        <div class="receipt-row receipt-total"><strong>Total Bayar</strong><strong>${formatPrice(orderData.totalPrice)}</strong></div>
      </div>
      <div class="payment-actions">
        <button class="btn btn-outline btn-full" onclick="closePaymentModal()">Batal</button>
        <button class="btn btn-primary btn-full" id="confirmPaymentBtn">Bayar & Kirim ke WhatsApp</button>
      </div>
    </div>`;

  overlay.style.display = "flex";
  setTimeout(() => overlay.classList.add("open"), 10);
  document.body.style.overflow = "hidden";

  const confirmBtn = document.getElementById("confirmPaymentBtn");
  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      const customerName = document.getElementById("customerName")?.value.trim();
      const customerPhone = document.getElementById("customerPhone")?.value.trim();
      const customerAddress = document.getElementById("customerAddress")?.value.trim();

      if (!customerName || !customerPhone || !customerAddress) {
        showToast("❗ Lengkapi nama, nomor telepon, dan alamat lengkap sebelum lanjut ke WhatsApp.");
        return;
      }

      const voucherText = appliedVoucher ? `Voucher: ${appliedVoucher.code} (diskon ${formatPrice(orderData.discountPrice)})` : "Voucher: tidak ada";
      const waMessage = encodeURIComponent(`🌸 Halo, Selamat datang di Lifa Flora 🌸\n\nTerima kasih sudah melakukan pemesanan 💗 Berikut detail pesanan Anda:\n\n🧾 Detail Pesanan\n* Produk:\n- ${orderData.itemsText.replace(/\n/g, '\n- ')}\nSubtotal: _${formatPrice(orderData.subtotalPrice)}_\nDiskon: _-${formatPrice(orderData.discountPrice)}_\n${voucherText}\nTotal Pembayaran: _${formatPrice(orderData.totalPrice)}_\n\n📌 Informasi Pesanan\n* No. Pesanan: #${orderData.orderNum}\n* Tanggal: ${orderData.tgl} | ${orderData.jam} WIB\n\n💳 Metode Pembayaran\nTransfer SeaBank\nNo. Rekening: 901809290073\n\n👤 Data Pemesan\n* Nama: ${customerName}\n* No. Telepon: ${customerPhone}\n* Alamat: ${customerAddress}\n\n📍 Konfirmasi Pesanan\nMohon kirim bukti pembayaran agar pesanan dapat segera diproses. Pesanan akan diproses setelah pembayaran terverifikasi 💗\n\n🚚 GRATIS ONGKIR untuk area Bandung 🌷`);

      cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product) {
          product.stock = Math.max(0, Number(product.stock || 0) - Number(item.qty));
        }
      });

      const order = {
        orderNum: orderData.orderNum,
        date: orderData.tgl,
        time: orderData.jam,
        customerName,
        customerPhone,
        customerAddress,
        items: cart.map(item => ({ id: item.id, name: item.name, price: item.price, qty: item.qty })),
        total: orderData.totalPrice,
        discount: orderData.discountPrice,
        voucher: appliedVoucher ? appliedVoucher.code : null
      };
      recordOrder(order);
      saveState();
      window.open(`https://api.whatsapp.com/send?phone=6287710793723&text=${waMessage}`, "_blank");
      closePaymentModal();
      cart = [];
      appliedVoucher = null;
      updateCartUI();
      toggleCart();
      renderProducts(currentFilter);
      showReceiptModal(`
        <div class="receipt-modal">
          <div class="receipt-header">
            <div class="receipt-flower">🌸</div>
            <h2>Pesanan Diterima!</h2>
            <p>Terima kasih sudah memesan di Lifa Flora 💐</p>
          </div>
          <div class="receipt-order-num">
            <span>No. Pesanan</span>
            <strong>#${orderData.orderNum}</strong>
          </div>
          <div class="receipt-date"><span>📅 ${orderData.tgl} · ${orderData.jam} WIB</span></div>
          <div class="receipt-divider">— Rincian Pesanan —</div>
          <div class="receipt-items">${orderData.itemsHTML}</div>
          <div class="receipt-divider"></div>
          <div class="receipt-summary">
            <div class="receipt-row"><span>Subtotal</span><span>${formatPrice(orderData.subtotalPrice)}</span></div>
            <div class="receipt-row"><span>Diskon</span><span class="discount-green">-${formatPrice(orderData.discountPrice)}</span></div>
            <div class="receipt-row"><span>Ongkir</span><span class="free-green">✓ GRATIS</span></div>
            <div class="receipt-row receipt-total"><strong>Total Bayar</strong><strong>${formatPrice(orderData.totalPrice)}</strong></div>
          </div>
          <div class="receipt-note">🏦 Pembayaran via SeaBank: 901809290073<br/>📱 Pesananmu sudah kami kirimkan ke WhatsApp untuk diproses. Harap kirimkan bukti pembayaran dan alamat lengkap jika belum melengkapinya.</div>
          <button class="btn btn-primary btn-full receipt-ok-btn" onclick="closeReceiptModal()">✓ Oke, Terima Kasih!</button>
        </div>`, () => {
        showToast("✅ Pesanan berhasil dikirim ke WhatsApp untuk diproses 💐");
      });
    });
  }
}

function closePaymentModal() {
  const overlay = document.getElementById("paymentOverlay");
  if (overlay) {
    overlay.classList.remove("open");
    setTimeout(() => {
      overlay.style.display = "none";
      overlay.innerHTML = "";
    }, 350);
  }
  document.body.style.overflow = "";
}

let receiptCallback = null;
function showReceiptModal(htmlContent, callback) {
  receiptCallback = callback;
  let overlay = document.getElementById("receiptOverlay");
  if (!overlay) { overlay = document.createElement("div"); overlay.id = "receiptOverlay"; overlay.className = "receipt-overlay"; document.body.appendChild(overlay); }
  overlay.innerHTML = `<div class="receipt-box">${htmlContent}</div>`;
  overlay.style.display = "flex";
  setTimeout(() => overlay.classList.add("open"), 10);
  document.body.style.overflow = "hidden";
}
function closeReceiptModal() {
  const overlay = document.getElementById("receiptOverlay");
  if (overlay) { overlay.classList.remove("open"); setTimeout(() => { overlay.style.display = "none"; }, 350); }
  document.body.style.overflow = "";
  if (receiptCallback) { receiptCallback(); receiptCallback = null; }
}

function showConfirmModal(title, desc, onConfirm) {
  let overlay = document.getElementById("confirmOverlay");
  if (!overlay) { overlay = document.createElement("div"); overlay.id = "confirmOverlay"; overlay.className = "receipt-overlay"; document.body.appendChild(overlay); }
  overlay.innerHTML = `
    <div class="receipt-box confirm-box">
      <div style="font-size:2.5rem;margin-bottom:0.75rem">🗑️</div>
      <h3 style="font-family:'Playfair Display',serif;margin-bottom:0.5rem">${title}</h3>
      <p style="color:var(--text-mid);font-size:0.9rem;margin-bottom:1.5rem">${desc}</p>
      <div style="display:flex;gap:0.75rem">
        <button class="btn btn-outline btn-full" onclick="closeConfirmModal()">Batal</button>
        <button class="btn btn-primary btn-full" id="confirmYesBtn">Ya, Hapus</button>
      </div>
    </div>`;
  overlay.style.display = "flex";
  setTimeout(() => overlay.classList.add("open"), 10);
  document.body.style.overflow = "hidden";
  document.getElementById("confirmYesBtn").addEventListener("click", () => { closeConfirmModal(); onConfirm(); });
}
function closeConfirmModal() {
  const overlay = document.getElementById("confirmOverlay");
  if (overlay) { overlay.classList.remove("open"); setTimeout(() => { overlay.style.display = "none"; }, 350); }
  document.body.style.overflow = "";
}

function closeMenu() {
  const nav = document.getElementById("navLinks");
  const hamburger = document.getElementById("hamburger");
  nav.classList.remove("open");
  document.body.classList.remove("menu-open");
  if (hamburger) hamburger.setAttribute("aria-expanded", "false");
}

function toggleMenu() {
  const nav = document.getElementById("navLinks");
  const hamburger = document.getElementById("hamburger");
  const isOpen = nav.classList.toggle("open");
  document.body.classList.toggle("menu-open", isOpen);
  if (hamburger) hamburger.setAttribute("aria-expanded", isOpen ? "true" : "false");
}

document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", () => closeMenu());
});

document.addEventListener("click", (event) => {
  const nav = document.getElementById("navLinks");
  const hamburger = document.getElementById("hamburger");
  if (window.innerWidth <= 767 && nav && hamburger && !nav.contains(event.target) && !hamburger.contains(event.target)) {
    closeMenu();
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 767) closeMenu();
});

window.addEventListener("scroll", () => {
  document.getElementById("navbar").classList.toggle("scrolled", window.scrollY > 50);
});

window.addEventListener("scroll", () => {
  const sections = ["home", "products", "contact"];
  let current = "home";
  sections.forEach(id => { const s = document.getElementById(id); if (s && window.scrollY >= s.offsetTop - 120) current = id; });
  document.querySelectorAll(".nav-link").forEach(link => { link.classList.toggle("active", link.getAttribute("href") === "#" + current); });
});

function openInfoCardByHash(hash) {
  const normalizedHash = hash.replace("#", "");
  const cards = document.querySelectorAll(".info-card");
  if (!cards.length) return;

  cards.forEach(card => {
    const button = card.querySelector(".info-toggle");
    const panel = card.querySelector(".info-panel");
    const isTarget = card.id === normalizedHash;

    card.classList.toggle("active", isTarget);
    if (button) button.setAttribute("aria-expanded", isTarget ? "true" : "false");
    if (panel) panel.setAttribute("aria-hidden", isTarget ? "false" : "true");
  });

  if (normalizedHash) {
    const targetCard = document.getElementById(normalizedHash);
    if (targetCard) {
      setTimeout(() => {
        const navbarHeight = document.querySelector(".navbar")?.offsetHeight || 0;
        const topPosition = targetCard.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 16;
        window.scrollTo({ top: topPosition, behavior: "smooth" });
      }, 50);
    }
  }
}

function initInfoAccordion() {
  const cards = document.querySelectorAll(".info-card");
  if (!cards.length) return;

  cards.forEach(card => {
    const button = card.querySelector(".info-toggle");
    const panel = card.querySelector(".info-panel");
    if (!button || !panel) return;

    button.addEventListener("click", () => {
      const shouldOpen = !card.classList.contains("active");
      cards.forEach(item => {
        const itemButton = item.querySelector(".info-toggle");
        const itemPanel = item.querySelector(".info-panel");
        item.classList.remove("active");
        if (itemButton) itemButton.setAttribute("aria-expanded", "false");
        if (itemPanel) itemPanel.setAttribute("aria-hidden", "true");
      });

      if (shouldOpen) {
        card.classList.add("active");
        button.setAttribute("aria-expanded", "true");
        panel.setAttribute("aria-hidden", "false");
      }
    });
  });

  openInfoCardByHash(window.location.hash);
}

window.addEventListener("hashchange", () => {
  openInfoCardByHash(window.location.hash);
});

let toastTimeout;
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2500);
}

function createConfettiBurst(x, y) {
  const colors = ["#F4A7B9", "#E8758F", "#B5D5C5", "#FFFFFF"];
  const pieces = 26;

  for (let i = 0; i < pieces; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${x}px`;
    piece.style.top = `${y}px`;
    piece.style.background = colors[i % colors.length];
    piece.style.setProperty("--tx", `${(Math.random() - 0.5) * 140}px`);
    piece.style.setProperty("--ty", `${(Math.random() - 0.5) * 160 + 90}px`);
    piece.style.setProperty("--rot", `${Math.random() * 360}deg`);
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 1250);
  }
}

function copyVoucherCode() {
  const codeEl = document.getElementById("voucherCodeText");
  const code = codeEl?.textContent?.trim();
  const button = document.querySelector(".voucher-copy-btn");
  const side = document.querySelector(".voucher-side");
  if (!code) return;

  const triggerX = side ? side.getBoundingClientRect().left + side.getBoundingClientRect().width / 2 : window.innerWidth / 2;
  const triggerY = side ? side.getBoundingClientRect().top + 36 : 140;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code)
      .then(() => {
        createConfettiBurst(triggerX, triggerY);
        if (button) {
          button.textContent = "✓ Tersalin";
          button.classList.add("copied");
          setTimeout(() => {
            button.textContent = "Salin Kode";
            button.classList.remove("copied");
          }, 1200);
        }
        showToast(`✅ Kode ${code} disalin!`);
      })
      .catch(() => fallbackCopy(code, triggerX, triggerY));
  } else {
    fallbackCopy(code, triggerX, triggerY);
  }
}

function fallbackCopy(text, x, y) {
  const tempInput = document.createElement("input");
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand("copy");
  document.body.removeChild(tempInput);
  createConfettiBurst(x, y);
  showToast(`✅ Kode ${text} disalin!`);
}

function initRevealOnScroll() {
  const elements = document.querySelectorAll(".reveal-on-scroll");
  if (!("IntersectionObserver" in window) || !elements.length) {
    elements.forEach(el => el.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  elements.forEach(el => observer.observe(el));
}

function goToCheckout() {
  if (cart.length === 0) { showToast("❗ Keranjangmu masih kosong!"); return; }
  window.location.href = "checkout.html";
}

function initApp() {
  loadState();
  renderProducts("semua");
  initInfoAccordion();
  initRevealOnScroll();
  updateNavAuth();
}

/* ============================================================
   AUTH PAGES: login.html / register.html
   ============================================================ */
function initLoginPage() {
  const form = document.getElementById("lfLoginForm");
  if (!form) return;
  form.addEventListener("submit", function(e) {
    e.preventDefault();
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      document.getElementById("lfLoginMsg").textContent = "Email atau password salah.";
      return;
    }
    setSession({ id: user.id, nama: user.nama, email: user.email });
    window.location.href = "index.html";
  });
}

function initRegisterPage() {
  const form = document.getElementById("lfRegisterForm");
  if (!form) return;
  form.addEventListener("submit", function(e) {
    e.preventDefault();
    const nama = form.nama.value.trim();
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;
    if (!nama || !email || !password) return;
    const users = getUsers();
    if (users.some(u => u.email === email)) {
      document.getElementById("lfRegisterMsg").textContent = "Email sudah terdaftar.";
      return;
    }
    users.push({ id: "u_" + Date.now(), nama, email, password });
    saveUsers(users);
    document.getElementById("lfRegisterMsg").textContent = "Akun berhasil dibuat! Mengarahkan ke login...";
    setTimeout(() => { window.location.href = "login.html"; }, 1200);
  });
}

/* ============================================================
   PROFILE PAGE
   ============================================================ */
function initProfilePage() {
  const session = getSession();
  if (!session) { window.location.href = "login.html"; return; }

  const namaEl = document.getElementById("pfNama");
  const emailEl = document.getElementById("pfEmail");
  if (namaEl) namaEl.value = session.nama;
  if (emailEl) emailEl.value = session.email;

  const saveBtn = document.getElementById("pfSaveBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const newNama = namaEl?.value.trim();
      if (!newNama) { showToast("⚠️ Nama tidak boleh kosong."); return; }
      session.nama = newNama;
      setSession(session);
      const users = getUsers();
      const idx = users.findIndex(u => u.id === session.id);
      if (idx > -1) { users[idx].nama = newNama; saveUsers(users); }
      showToast("✅ Profil berhasil disimpan.");
    });
  }

  // order history in profile
  const orderList = document.getElementById("pfOrderList");
  if (orderList) {
    const orders = getAllOrders().filter(o => o.userId === session.id);
    if (!orders.length) {
      orderList.innerHTML = "<p style='color:var(--text-light)'>Belum ada pesanan.</p>";
    } else {
      orderList.innerHTML = orders.map(o => `
        <div class="pf-order-card">
          <div><strong>#${o.orderNum}</strong> &nbsp;·&nbsp; ${fmtDate(o.createdAt)}</div>
          <div>Total: <strong>${formatPrice(o.total)}</strong> &nbsp;·&nbsp; <span class="pf-status">${o.status || "Diproses"}</span></div>
          <div style="font-size:0.83rem;color:var(--text-light)">${o.items.map(i=>i.name+" x"+i.qty).join(", ")}</div>
        </div>`).join("");
    }
  }

  // menu switching
  document.querySelectorAll(".pf-menu-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".pf-menu-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".pf-panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      const target = document.getElementById(btn.dataset.panel);
      if (target) target.classList.add("active");
    });
  });
}

/* ============================================================
   CHECKOUT PAGE
   ============================================================ */
function initCheckoutPage() {
  loadState();
  const session = getSession();
  const cartItemsEl = document.getElementById("coCartItems");
  const subtotalEl = document.getElementById("coSubtotal");
  const discountEl = document.getElementById("coDiscount");
  const ongkirEl = document.getElementById("coOngkir");
  const totalEl = document.getElementById("coTotal");
  const shippingEl = document.getElementById("coShipping");
  const voucherEl = document.getElementById("coVoucher");
  const paymentEl = document.getElementById("coPayment");
  const namaEl = document.getElementById("coNama");
  const phoneEl = document.getElementById("coPhone");
  const alamatEl = document.getElementById("coAlamat");
  const submitBtn = document.getElementById("coSubmitBtn");
  const errorEl = document.getElementById("coError");

  if (!cartItemsEl) return;

  if (cart.length === 0) {
    cartItemsEl.innerHTML = "<p style='color:var(--text-light)'>Keranjang kosong.</p>";
    if (submitBtn) submitBtn.disabled = true;
    return;
  }

  // Pre-fill from session
  if (session) {
    if (namaEl) namaEl.value = session.nama || "";
  }

  function recompute() {
    const summary = getCartSummary();
    const shipping = Number(shippingEl?.value || 0);
    const voucherCode = voucherEl?.value.trim().toUpperCase() || "";
    let discount = summary.discount;
    if (voucherCode === "LIFA10" && summary.totalItems >= 2) {
      discount = Math.min(summary.subtotal * 0.1, 50000);
    }
    const total = summary.subtotal - discount + shipping;
    if (subtotalEl) subtotalEl.textContent = formatPrice(summary.subtotal);
    if (discountEl) discountEl.textContent = "-" + formatPrice(discount);
    if (ongkirEl) ongkirEl.textContent = shipping === 0 ? "GRATIS" : formatPrice(shipping);
    if (totalEl) totalEl.textContent = formatPrice(Math.max(0, total));
  }

  // render cart items
  cartItemsEl.innerHTML = cart.map(item => `
    <div class="co-item">
      <span class="co-emoji">${item.emoji}</span>
      <div class="co-item-info">
        <div class="co-item-name">${item.name} <span style="color:var(--text-light)">x${item.qty}</span></div>
        <div class="co-item-price">${formatPrice(item.price * item.qty)}</div>
      </div>
    </div>`).join("");

  recompute();
  if (shippingEl) shippingEl.addEventListener("change", recompute);
  if (voucherEl) voucherEl.addEventListener("input", recompute);

  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      const nama = namaEl?.value.trim();
      const phone = phoneEl?.value.trim();
      const alamat = alamatEl?.value.trim();
      const payment = paymentEl?.value || "Transfer Bank";
      if (!nama || !phone || !alamat) {
        if (errorEl) errorEl.textContent = "Lengkapi nama, nomor telepon, dan alamat.";
        return;
      }
      if (errorEl) errorEl.textContent = "";

      const summary = getCartSummary();
      const shipping = Number(shippingEl?.value || 0);
      const voucherCode = voucherEl?.value.trim().toUpperCase() || "";
      let discount = summary.discount;
      if (voucherCode === "LIFA10" && summary.totalItems >= 2) {
        discount = Math.min(summary.subtotal * 0.1, 50000);
      }
      const total = Math.max(0, summary.subtotal - discount + shipping);
      const orderNum = "LF" + Date.now().toString().slice(-6);
      const now = new Date();

      const order = {
        orderNum,
        userId: session?.id || null,
        createdAt: now.toISOString(),
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, emoji: i.emoji || '💐' })),
        subtotal: summary.subtotal,
        discount,
        shipping,
        total,
        payment,
        nama,
        phone,
        alamat,
        status: "Diproses"
      };

      // update stock
      cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product) product.stock = Math.max(0, Number(product.stock || 0) - Number(item.qty));
      });

      const allOrders = getAllOrders();
      allOrders.unshift(order);
      saveAllOrders(allOrders);
      saveLastOrder(order);
      saveState();

      // WA
      const itemsText = cart.map(i => `- ${i.name} x${i.qty} (${formatPrice(i.price * i.qty)})`).join("\n");
      const shippingLabel = shipping === 0 ? "Reguler (GRATIS)" : shipping === 10000 ? "Express (Rp 10.000)" : "Same Day (Rp 20.000)";
      const waMsg = encodeURIComponent(`🌸 Halo Lifa Flora!\n\n*Pesanan Baru* #${orderNum}\n\n🛍️ Produk:\n${itemsText}\n\n💰 Subtotal: ${formatPrice(summary.subtotal)}\n🎟️ Diskon: -${formatPrice(discount)}\n🚗 Ongkir: ${formatPrice(shipping)}\n*Total: ${formatPrice(total)}*\n\n💳 Pembayaran: ${payment}\n🚚 Pengiriman: ${shippingLabel}\n\n👤 Nama: ${nama}\n📱 Telepon: ${phone}\n📍 Alamat: ${alamat}\n\nMohon konfirmasi pesanan ini ya! 🌷`);
      window.open(`https://api.whatsapp.com/send?phone=6287710793723&text=${waMsg}`, "_blank");

      cart = [];
      appliedVoucher = null;
      // Hapus cart dari localStorage setelah checkout
      localStorage.removeItem(STORAGE_CART_PERSIST_KEY);
      window.location.href = "order_success.html";
    });
  }
}

/* ============================================================
   ORDER SUCCESS PAGE
   ============================================================ */
function initOrderSuccessPage() {
  const order = getLastOrder();
  const idEl = document.getElementById("osOrderNum");
  const totalEl = document.getElementById("osTotal");
  const statusEl = document.getElementById("osStatus");
  if (idEl) idEl.textContent = order ? "#" + order.orderNum : "-";
  if (totalEl) totalEl.textContent = order ? formatPrice(order.total) : "Rp 0";
  if (statusEl) statusEl.textContent = order ? (order.status || "Diproses") : "-";
}

/* ============================================================
   TRACKING PAGE
   ============================================================ */
function initTrackingPage() {
  const session = getSession();
  const grid    = document.getElementById("trackGrid");
  const emptyEl = document.getElementById("trackEmpty");
  if (!grid) return;

  const STEPS = ["Diproses", "Dikirim", "Selesai"];

  const statusNext  = s => s === "Diproses" ? "Dikirim" : s === "Dikirim" ? "Selesai" : "Selesai";
  const statusColor = s => s === "Selesai" ? "#6DA58A" : s === "Dikirim" ? "#8B5CF6" : "#E8758F";
  const statusBg    = s => s === "Selesai" ? "#E8F5EE" : s === "Dikirim" ? "#EDE9FE" : "#FDE8EE";

  function buildTimeline(status) {
    const current = STEPS.indexOf(status);
    let html = '<div class="track-timeline">';
    STEPS.forEach((step, i) => {
      const isDone   = i < current;
      const isActive = i === current;
      const dotClass = isDone ? "done" : isActive ? "active" : "";
      const lblClass = isDone || isActive ? (isDone ? "done" : "active") : "";
      html += `<div class="track-step">
        <div class="track-step-dot ${dotClass}">${isDone ? "✓" : i + 1}</div>
        <div class="track-step-label ${lblClass}">${step}</div>
      </div>`;
      if (i < STEPS.length - 1) {
        html += `<div class="track-line ${isDone ? "done" : ""}"></div>`;
      }
    });
    html += '</div>';
    return html;
  }

  function render() {
    let allOrd   = getAllOrders();
    let filtered = session ? allOrd.filter(o => o.userId === session.id) : allOrd;

    if (!filtered.length) {
      if (emptyEl) emptyEl.style.display = "block";
      grid.innerHTML = "";
      return;
    }
    if (emptyEl) emptyEl.style.display = "none";

    grid.innerHTML = filtered.map(o => {
      const status    = o.status || "Diproses";
      const canUpdate = status !== "Selesai";
      const nextLabel = statusNext(status);
      const itemsText = o.items.map(i => `${i.emoji || "💐"} ${i.name} x${i.qty}`).join(" · ");

      return `<div class="track-card">
        <div class="track-header">
          <span class="track-num">#${o.orderNum}</span>
          <span class="track-status" style="background:${statusBg(status)};color:${statusColor(status)}">${status}</span>
        </div>
        <div class="track-date">📅 ${fmtDate(o.createdAt)}</div>
        ${buildTimeline(status)}
        <div class="track-items">${itemsText}</div>
        <div class="track-total">Total: <strong>${formatPrice(o.total)}</strong></div>
        <button class="track-update-btn" data-id="${o.orderNum}" ${canUpdate ? "" : "disabled"}>
          ${canUpdate ? "Update → " + nextLabel : "✓ Pesanan Selesai"}
        </button>
      </div>`;
    }).join("");

    grid.querySelectorAll(".track-update-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id      = btn.dataset.id;
        const allOrd2 = getAllOrders();
        const idx     = allOrd2.findIndex(o => o.orderNum === id);
        if (idx > -1) {
          allOrd2[idx].status = statusNext(allOrd2[idx].status || "Diproses");
          saveAllOrders(allOrd2);
          const lastOrd = getLastOrder();
          if (lastOrd && lastOrd.orderNum === id) saveLastOrder(allOrd2[idx]);
          render();
        }
      });
    });
  }

  render();
}

/* ============================================================
   PAGE ROUTER — called on each page
   ============================================================ */
function initPageRouter() {
  const path = location.pathname.split("/").pop() || "index.html";
  updateNavAuth();
  if (path === "login.html") initLoginPage();
  if (path === "register.html") initRegisterPage();
  if (path === "profile.html") initProfilePage();
  if (path === "checkout.html") initCheckoutPage();
  if (path === "order_success.html") initOrderSuccessPage();
  if (path === "tracking.html") initTrackingPage();
}

function submitContact() {
  const name  = document.getElementById("contactName").value.trim();
  const phone = document.getElementById("contactPhone").value.trim();
  const msg   = document.getElementById("contactMsg").value.trim();
  if (!name || !phone || !msg) { showToast("❗ Semua kolom wajib diisi!"); return; }
  const waMessage = encodeURIComponent(`Halo Lifa Flora! 🌸\n\nNama  : ${name}\nHP    : ${phone}\nPesan : ${msg}`);
  window.open(`https://api.whatsapp.com/send?phone=6287710793723&text=${waMessage}`, "_blank");
  document.getElementById("contactName").value = "";
  document.getElementById("contactPhone").value = "";
  document.getElementById("contactMsg").value = "";
  showToast("✅ Mengarahkan ke WhatsApp...");
}

lucide.createIcons();
initApp();
updateNavAuth();