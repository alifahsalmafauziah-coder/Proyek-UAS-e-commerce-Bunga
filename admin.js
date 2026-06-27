/* ============================================================
   admin.js — Lifa Flora Admin Dashboard (halaman terpisah)
   Menggunakan localStorage yang sama dengan toko (index.html)
   sehingga perubahan stok & data pesanan langsung sinkron.
   ============================================================ */

const STORAGE_PRODUCTS_KEY = "lifaFloraProducts";
const STORAGE_ORDERS_KEY = "lifaFloraOrders";
const ADMIN_SESSION_KEY = "lifaFloraAdminSession";
const ADMIN_PASSWORD = "admin123";

let products = [];
let orders = [];

function formatPrice(num) {
  return "Rp " + num.toLocaleString("id-ID");
}

function loadState() {
  const storedProducts = localStorage.getItem(STORAGE_PRODUCTS_KEY);
  const storedOrders = localStorage.getItem(STORAGE_ORDERS_KEY);
  products = storedProducts ? JSON.parse(storedProducts) : [];
  orders = storedOrders ? JSON.parse(storedOrders) : [];
  if (!Array.isArray(products)) products = [];
  if (!Array.isArray(orders)) orders = [];
}

function saveProducts() {
  localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(products));
}

let toastTimeout;
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2500);
}

function isAdminLoggedIn() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

function showDashboard() {
  document.getElementById("loginGate").style.display = "none";
  document.getElementById("adminPanelSection").style.display = "block";
  document.getElementById("logoutBtn").style.display = "inline-flex";
  loadState();
  renderAdminPanel();
}

function showLoginGate() {
  document.getElementById("loginGate").style.display = "flex";
  document.getElementById("adminPanelSection").style.display = "none";
  document.getElementById("logoutBtn").style.display = "none";
}

function submitAdminLogin() {
  const input = document.getElementById("adminPasswordInput");
  const password = input?.value.trim() || "";
  if (password !== ADMIN_PASSWORD) {
    showToast("❌ Kata sandi salah. Coba lagi.");
    return;
  }
  sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
  if (input) input.value = "";
  showDashboard();
  showToast("✅ Admin berhasil login.");
}

function logoutAdmin() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  showLoginGate();
  showToast("🔒 Admin logout.");
}

function renderAdminPanel() {
  renderAdminProductTable();
  renderAdminOrderList();
}

function renderAdminProductTable() {
  const container = document.getElementById("adminProductTable");
  if (!container) return;
  container.innerHTML = "";

  if (products.length === 0) {
    container.innerHTML = `<div class="admin-empty-order">Belum ada produk. Buka halaman toko (index.html) minimal sekali agar data produk awal tersimpan.</div>`;
    return;
  }

  products.forEach(product => {
    const stockCount = Number(product.stock || 0);
    const row = document.createElement("div");
    row.className = "admin-product-row";
    row.innerHTML = `
      <div class="admin-product-info">
        <div class="admin-product-name">${product.emoji} ${product.name}</div>
        <div class="admin-product-stock">Stok: <strong>${stockCount}</strong></div>
      </div>
      <div class="admin-product-actions">
        <button class="btn btn-outline" onclick="adjustStock(${product.id}, -1)">-</button>
        <button class="btn btn-outline" onclick="adjustStock(${product.id}, 1)">+</button>
      </div>`;
    container.appendChild(row);
  });
}

function renderAdminOrderList() {
  const container = document.getElementById("adminOrderList");
  if (!container) return;
  container.innerHTML = "";
  if (orders.length === 0) {
    container.innerHTML = `<div class="admin-empty-order">Belum ada pembeli yang checkout.</div>`;
    return;
  }

  orders.slice().reverse().forEach(order => {
    const card = document.createElement("div");
    card.className = "admin-order-card-item";
    card.innerHTML = `
      <div class="admin-order-header">
        <div><strong>No. Pesanan</strong> #${order.orderNum}</div>
        <div>${order.date} · ${order.time}</div>
      </div>
      <div class="admin-order-customer">
        <strong>${order.customerName}</strong><br />${order.customerPhone}<br />${order.customerAddress}
      </div>
      <div class="admin-order-items">
        ${order.items.map(item => `<div class="admin-order-item">${item.qty} × ${item.name} (${formatPrice(item.price * item.qty)})</div>`).join("")}
      </div>
      <div class="admin-order-summary">Total: <strong>${formatPrice(order.total)}</strong></div>`;
    container.appendChild(card);
  });
}

function adjustStock(productId, delta) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  product.stock = Math.max(0, Number(product.stock || 0) + delta);
  saveProducts();
  renderAdminProductTable();
  showToast("✅ Stok diperbarui.");
}

function initAdminApp() {
  lucide.createIcons();
  if (isAdminLoggedIn()) {
    showDashboard();
  } else {
    showLoginGate();
  }
}

initAdminApp();
