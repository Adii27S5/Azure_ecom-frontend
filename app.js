/**
 * Azure E-Commerce Storefront Frontend Application
 * Interacts with backend API endpoints:
 * - GET /health
 * - GET /api/products
 * - GET /api/search?q=...
 * - GET /api/dashboard
 * - POST /api/orders
 * - GET /api/heavy-operation
 */

// Determine API Base URL
const API_BASE = window.location.port === '8080' ? '' : 'http://localhost:8080';

// State
let products = [];
let cart = JSON.parse(localStorage.getItem('azure_ecom_cart') || '[]');
let activeCategory = '';
let currentSearch = '';
let currentSort = 'featured';

// Category icon map
const categoryIcons = {
  'Laptops': '💻',
  'Smartphones': '📱',
  'Monitors': '🖥️',
  'Audio': '🎧',
  'Accessories': '⌨️',
  'Gaming': '🎮',
  'Storage': '💾'
};

// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const searchInput = document.getElementById('searchInput');
const categoryChips = document.getElementById('categoryChips');
const sortSelect = document.getElementById('sortSelect');
const backendStatusText = document.getElementById('backendStatusText');
const pulseDot = document.getElementById('pulseDot');
const openCartBtn = document.getElementById('openCartBtn');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartDrawer = document.getElementById('cartDrawer');
const overlay = document.getElementById('overlay');
const cartItems = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const subtotalVal = document.getElementById('subtotalVal');
const taxVal = document.getElementById('taxVal');
const totalVal = document.getElementById('totalVal');
const checkoutBtn = document.getElementById('checkoutBtn');
const heroTotalProducts = document.getElementById('heroTotalProducts');
const heroTotalOrders = document.getElementById('heroTotalOrders');

// 1. Health check & Backend latency polling
async function checkBackendHealth() {
  const start = performance.now();
  try {
    const res = await fetch(`${API_BASE}/health`);
    const duration = Math.round(performance.now() - start);
    if (res.ok) {
      const data = await res.json();
      backendStatusText.textContent = `Backend Live (${duration}ms • ${data.instanceId.substring(0, 10)})`;
      pulseDot.style.background = '#4ade80';
      pulseDot.style.boxShadow = '0 0 8px #4ade80';
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    backendStatusText.textContent = 'Backend Offline';
    pulseDot.style.background = '#ef4444';
    pulseDot.style.boxShadow = '0 0 8px #ef4444';
  }
}

// 2. Fetch dashboard stats
async function fetchDashboardStats() {
  try {
    const res = await fetch(`${API_BASE}/api/dashboard`);
    if (res.ok) {
      const data = await res.json();
      if (data.stats) {
        if (data.stats.total_products) heroTotalProducts.textContent = `${data.stats.total_products}+`;
        if (data.stats.total_orders) heroTotalOrders.textContent = `${data.stats.total_orders.toLocaleString()}+`;
      }
    }
  } catch (err) {
    console.warn('Dashboard stats fetch failed:', err);
  }
}

// 3. Fetch products
async function fetchProducts() {
  try {
    let url = `${API_BASE}/api/products?limit=50`;
    if (activeCategory) {
      url += `&category=${encodeURIComponent(activeCategory)}`;
    }

    if (currentSearch) {
      url = `${API_BASE}/api/search?q=${encodeURIComponent(currentSearch)}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    products = json.data || [];
    renderProducts();
  } catch (err) {
    console.error('Error fetching products:', err);
    productsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ef4444;">
        Failed to load products from ${API_BASE}. Make sure the backend server is running on port 8080.
      </div>
    `;
  }
}

// 4. Render product cards
function renderProducts() {
  if (!products || products.length === 0) {
    productsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
        No products found matching your filter criteria.
      </div>
    `;
    return;
  }

  // Sort
  let sorted = [...products];
  if (currentSort === 'price-asc') {
    sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  } else if (currentSort === 'price-desc') {
    sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
  }

  productsGrid.innerHTML = sorted.map(p => {
    const icon = categoryIcons[p.category] || '📦';
    const price = parseFloat(p.price).toFixed(2);
    const rating = p.rating || 4.8;
    const imgHtml = p.image_url
      ? `<img src="${p.image_url}" alt="${p.name}" class="product-img" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"><span class="product-fallback-icon" style="display:none;">${icon}</span>`
      : `<span class="product-fallback-icon">${icon}</span>`;

    return `
      <div class="product-card">
        <span class="card-badge">${p.category}</span>
        <span class="card-rating">★ ${rating}</span>
        <div class="product-visual">
          ${imgHtml}
        </div>
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.description || 'High performance tech device verified with Azure Load Testing.'}</p>
        <div class="product-footer">
          <span class="product-price">$${price}</span>
          <button class="add-btn" onclick="addToCart(${p.id})">+ Add to Cart</button>
        </div>
      </div>
    `;
  }).join('');
}

// 5. Cart Management
window.addToCart = function(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      quantity: 1
    });
  }

  saveCart();
  renderCart();
  openCart();
};

function saveCart() {
  localStorage.setItem('azure_ecom_cart', JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalCount;
}

function renderCart() {
  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); margin-top: 40px;">
        Your cart is empty. Add products from the catalog!
      </div>
    `;
    subtotalVal.textContent = '$0.00';
    taxVal.textContent = '$0.00';
    totalVal.textContent = '$0.00';
    return;
  }

  let subtotal = 0;
  cartItems.innerHTML = cart.map((item, idx) => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;
    return `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-price">$${item.price.toFixed(2)} x ${item.quantity} = $${itemTotal.toFixed(2)}</div>
        </div>
        <div class="qty-controls">
          <button class="qty-btn" onclick="changeQty(${idx}, -1)">-</button>
          <span style="font-size: 13px; font-weight: 600;">${item.quantity}</span>
          <button class="qty-btn" onclick="changeQty(${idx}, 1)">+</button>
        </div>
      </div>
    `;
  }).join('');

  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  subtotalVal.textContent = `$${subtotal.toFixed(2)}`;
  taxVal.textContent = `$${tax.toFixed(2)}`;
  totalVal.textContent = `$${total.toFixed(2)}`;
}

window.changeQty = function(idx, delta) {
  cart[idx].quantity += delta;
  if (cart[idx].quantity <= 0) {
    cart.splice(idx, 1);
  }
  saveCart();
  renderCart();
};

function openCart() {
  cartDrawer.classList.add('open');
  overlay.classList.add('active');
}

function closeCart() {
  cartDrawer.classList.remove('open');
  overlay.classList.remove('active');
}

// 6. Checkout: POST /api/orders
checkoutBtn.addEventListener('click', async () => {
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }

  checkoutBtn.disabled = true;
  checkoutBtn.textContent = 'Processing in Azure (POST /api/orders)...';

  const orderPayload = {
    userId: 1,
    items: cart.map(item => ({
      productId: item.id,
      quantity: item.quantity,
      unitPrice: item.price
    }))
  };

  try {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    alert(`🎉 Order #${data.orderId} Placed Successfully!\nTotal: $${data.totalAmount}\nProcessed via Azure App Service.`);
    cart = [];
    saveCart();
    renderCart();
    closeCart();
    fetchDashboardStats();
  } catch (err) {
    alert(`Order failed: ${err.message}. Check backend status.`);
  } finally {
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = 'Proceed to Checkout (POST /api/orders)';
  }
});

// Event Listeners
openCartBtn.addEventListener('click', openCart);
closeCartBtn.addEventListener('click', closeCart);
overlay.addEventListener('click', closeCart);

// Category filtering
categoryChips.addEventListener('click', (e) => {
  if (e.target.classList.contains('chip')) {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    e.target.classList.add('active');
    activeCategory = e.target.getAttribute('data-category');
    currentSearch = '';
    searchInput.value = '';
    fetchProducts();
  }
});

// Search input debounced
let searchTimeout = null;
searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentSearch = e.target.value.trim();
    fetchProducts();
  }, 350);
});

// Sorting
sortSelect.addEventListener('change', (e) => {
  currentSort = e.target.value;
  renderProducts();
});

// Initialize
updateCartBadge();
renderCart();
checkBackendHealth();
fetchDashboardStats();
fetchProducts();

setInterval(checkBackendHealth, 5000);
