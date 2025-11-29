// --- Constants ---
const PRODUCTS_KEY = 'products';
const CART_KEY = 'cart';
const USERS_KEY = 'users';
const CURRENT_USER_KEY = 'currentUser';
const ORDERS_KEY = 'orders';

// --- Authentication ---

function register(name, email, password, isAdmin = false) {
    let users = getLocalStorage(USERS_KEY);
    if (users.find(u => u.email === email)) {
        return false; // User exists
    }
    users.push({ name, email, password, isAdmin });
    setLocalStorage(USERS_KEY, users);
    return true;
}

function login(email, password) {
    let users = getLocalStorage(USERS_KEY);
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        return true;
    }
    return false;
}

function logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
    window.location.href = './index.html';
}

function getLoggedInUser() {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
}

function isAdmin() {
    const user = getLoggedInUser();
    return user && user.isAdmin;
}

// --- Local Storage Helpers ---

function getLocalStorage(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

function setLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// --- Product Management (Admin) ---

function addProduct(product) {
    let products = getLocalStorage(PRODUCTS_KEY);
    product.id = Date.now().toString(); // Simple ID generation
    products.push(product);
    setLocalStorage(PRODUCTS_KEY, products);
}

function deleteProduct(id) {
    let products = getLocalStorage(PRODUCTS_KEY);
    products = products.filter(p => p.id !== id);
    setLocalStorage(PRODUCTS_KEY, products);

    // Also remove from carts
    let cart = getLocalStorage(CART_KEY);
    cart = cart.filter(item => item.productId !== id);
    setLocalStorage(CART_KEY, cart);

    renderProducts();
}

function updateProduct(updatedProduct) {
    let products = getLocalStorage(PRODUCTS_KEY);
    const index = products.findIndex(p => p.id === updatedProduct.id);
    if (index !== -1) {
        products[index] = updatedProduct;
        setLocalStorage(PRODUCTS_KEY, products);
    }
}

// --- Reviews ---

function addReview(productId, review) {
    let products = getLocalStorage(PRODUCTS_KEY);
    const index = products.findIndex(p => p.id === productId);
    if (index !== -1) {
        if (!products[index].reviews) {
            products[index].reviews = [];
        }
        products[index].reviews.push(review);
        setLocalStorage(PRODUCTS_KEY, products);
        showToast('Review added!');
        return true;
    }
    return false;
}

// --- Shopping Cart ---

function addToCart(productId) {
    if (!getLoggedInUser()) {
        showToast('Please login to shop', 'error');
        setTimeout(() => window.location.href = './index.html', 1500);
        return;
    }

    const product = getProduct(productId);
    if (!product) return;

    let cart = getLocalStorage(CART_KEY);
    const existingItem = cart.find(item => item.productId === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ productId, quantity: 1, productDetails: product });
    }

    setLocalStorage(CART_KEY, cart);
    showToast('Added to cart!');
    updateCartBadge();
}

// Buy Now: replace cart with only this item and go to checkout
function buyNow(productId) {
    const user = getLoggedInUser();
    if (!user) {
        showToast('Please login first', 'error');
        setTimeout(() => window.location.href = './index.html', 900);
        return;
    }

    const product = getProduct(productId);
    if (!product) {
        showToast('Product not found', 'error');
        return;
    }

    // Replace cart with only this product
    const singleCart = [
        { productId, quantity: 1, productDetails: product }
    ];

    setLocalStorage(CART_KEY, singleCart);
    updateCartBadge();

    window.location.href = './checkout.html';
}



function updateCartQuantity(productId, quantity) {
    let cart = getLocalStorage(CART_KEY);
    const item = cart.find(i => i.productId === productId);
    if (item) {
        item.quantity = parseInt(quantity);
        if (item.quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setLocalStorage(CART_KEY, cart);
        renderCart();
        updateCartBadge();
    }
}

function removeFromCart(productId) {
    let cart = getLocalStorage(CART_KEY);
    cart = cart.filter(item => item.productId !== productId);
    setLocalStorage(CART_KEY, cart);
    renderCart();
    updateCartBadge();
}

function clearCart() {
    setLocalStorage(CART_KEY, []);
    renderCart();
    updateCartBadge();
}

function getCartTotal() {
    const cart = getLocalStorage(CART_KEY);
    return cart.reduce((total, item) => total + (item.productDetails.price * item.quantity), 0);
}

// --- UI Rendering ---

function updateNavbar() {
    const user = getLoggedInUser();
    const navLinks = document.getElementById('nav-links');
    const authLinks = document.getElementById('auth-links');

    if (!navLinks || !authLinks) return;

    if (user) {
        let linksHtml = `
            <li class="nav-item"><a class="nav-link" href="./home.html">Home</a></li>
            <li class="nav-item"><a class="nav-link" href="./shop.html">Shop</a></li>
            <li class="nav-item"><a class="nav-link" href="./cart.html">Cart <span id="cart-badge" class="badge bg-secondary">0</span></a></li>
        `;

        if (isAdmin()) {
            linksHtml += `<li class="nav-item"><a class="nav-link" href="./add-product.html">Add Product</a></li>`;
        }

        // Search Bar
        linksHtml += `
            <li class="nav-item ms-lg-3">
                <div class="input-group">
                    <input type="text" class="form-control form-control-sm border-0 shadow-none" id="search-input" placeholder="Search products..." style="background: rgba(255,255,255,0.1); color: var(--text-main); min-width: 200px;" oninput="filterProducts(this.value)">
                    <span class="input-group-text border-0 bg-transparent"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-search" viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg></span>
                </div>
            </li>
            <li class="nav-item ms-2">
                <button class="btn btn-sm btn-outline-secondary rounded-circle" onclick="toggleTheme()" id="theme-toggle">🌙</button>
            </li>
        `;

        navLinks.innerHTML = linksHtml;
        authLinks.innerHTML = `
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                    ${user.name}
                </a>
                <ul class="dropdown-menu dropdown-menu-end border-0 shadow-lg" style="background: var(--bg-color);">
                    <li><a class="dropdown-item" href="./profile.html" style="color: var(--text-main);">My Profile</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" onclick="logout()" style="color: var(--text-main);">Logout</a></li>
                </ul>
            </li>
        `;
        updateCartBadge();

        // Initialize Theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) toggleBtn.innerText = savedTheme === 'dark' ? '☀️' : '🌙';

    } else {
        // Should redirect to index if not on index
        if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) {
            // window.location.href = './index.html'; // Optional: strict auth check
        }
    }
}

function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
        const cart = getLocalStorage(CART_KEY);
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        badge.innerText = count;
    }
}

let currentSearchQuery = '';

function filterProducts(query) {
    currentSearchQuery = query.toLowerCase();
    renderProducts();
}

function renderProducts(filterCategory = 'All') {
    const container = document.getElementById('products-container');
    if (!container) return;

    let products = getLocalStorage(PRODUCTS_KEY);

    if (filterCategory !== 'All') {
        products = products.filter(p => p.category === filterCategory);
    }

    // Apply Search Filter
    if (currentSearchQuery) {
        products = products.filter(p =>
            p.name.toLowerCase().includes(currentSearchQuery) ||
            p.description.toLowerCase().includes(currentSearchQuery) ||
            p.category.toLowerCase().includes(currentSearchQuery)
        );
    }

    const userIsAdmin = isAdmin();

    if (products.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p class="text-muted">No products found.</p></div>';
        return;
    }

    container.innerHTML = products.map(p => `
        <div class="col-md-4 mb-4 animate-fade-up">
            <div class="neu-card h-100 p-3">
                <div style="cursor: pointer;" onclick="window.location.href='product-details.html?id=${p.id}'">
                    <img src="${p.imageURL}" class="card-img-top" alt="${p.name}" onerror="this.src='https://via.placeholder.com/300'">
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title fw-bold" style="cursor: pointer;" onclick="window.location.href='product-details.html?id=${p.id}'">${p.name}</h5>
                    <p class="card-text text-muted small">${p.category || 'General'}</p>
                    <p class="card-text text-truncate">${p.description}</p>
                    <h6 class="card-subtitle mb-3 text-primary fw-bold">$${p.price.toFixed(2)}</h6>
                    <div class="mt-auto d-flex gap-2">
                      ${userIsAdmin ? `
    <button class="btn btn-warning btn-sm flex-grow-1" onclick="editProduct('${p.id}')">Edit</button>
    <button class="btn btn-danger btn-sm flex-grow-1" onclick="deleteProduct('${p.id}')">Delete</button>
` : `
    <div class="d-flex gap-2 w-100">
      <button class="btn btn-neu btn-neu-primary flex-grow-1" onclick="addToCart('${p.id}')">Add to Cart</button>
      <button class="btn btn-success flex-shrink-0" onclick="buyNow('${p.id}')">Buy Now</button>
    </div>
`}

                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderCart() {
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    if (!container || !totalEl) return;

    const cart = getLocalStorage(CART_KEY);

    if (cart.length === 0) {
        container.innerHTML = '<tr><td colspan="5" class="text-center">Your cart is empty</td></tr>';
        totalEl.innerText = '0.00';
        return;
    }

    container.innerHTML = cart.map(item => `
        <tr>
            <td>
                <div class="d-flex align-items-center">
                    <img src="${item.productDetails.imageURL}" alt="" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px;">
                    ${item.productDetails.name}
                </div>
            </td>
            <td>$${item.productDetails.price.toFixed(2)}</td>
            <td>
                <input type="number" class="form-control" style="width: 80px" value="${item.quantity}" min="1" onchange="updateCartQuantity('${item.productId}', this.value)">
            </td>
            <td>$${(item.productDetails.price * item.quantity).toFixed(2)}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="removeFromCart('${item.productId}')">&times;</button>
            </td>
        </tr>
    `).join('');

    totalEl.innerText = getCartTotal().toFixed(2);
}

// --- Edit Product Helper ---
function editProduct(id) {
    localStorage.setItem('editProductId', id);
    window.location.href = './add-product.html';
}

function getProduct(id) {
    const products = getLocalStorage(PRODUCTS_KEY);
    return products.find(p => p.id === id);
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    updateNavbar();

    // Seed Data if empty
    const products = getLocalStorage(PRODUCTS_KEY);
    if (products.length === 0) {
        const seedProducts = [
            {
                id: 'p1',
                name: 'Wireless Headphones',
                price: 199.99,
                description: 'Premium noise-cancelling headphones with 30h battery life.',
                category: 'Electronics',
                imageURL: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&q=80',
                reviews: [
                    { user: 'Alice', rating: 5, comment: 'Amazing sound quality!' },
                    { user: 'Bob', rating: 4, comment: 'Comfortable but expensive.' }
                ]
            },
            {
                id: 'p2',
                name: 'Smart Watch',
                price: 299.99,
                description: 'Fitness tracker with heart rate monitor and GPS.',
                category: 'Electronics',
                imageURL: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&q=80',
                reviews: [
                    { user: 'Charlie', rating: 5, comment: 'Best tracker I have used.' }
                ]
            },
            {
                id: 'p3',
                name: 'Running Shoes',
                price: 89.99,
                description: 'Lightweight and comfortable running shoes for daily use.',
                category: 'Fashion',
                imageURL: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
                reviews: []
            },
            {
                id: 'p4',
                name: 'Leather Jacket',
                price: 149.99,
                description: 'Classic leather jacket for a stylish look.',
                category: 'Fashion',
                imageURL: 'https://images.unsplash.com/photo-1551028919-ac7675cf6c95?w=500&q=80',
                reviews: []
            },
            {
                id: 'p5',
                name: 'Modern Lamp',
                price: 49.99,
                description: 'Minimalist desk lamp with adjustable brightness.',
                category: 'Home & Living',
                imageURL: 'https://images.unsplash.com/photo-1507473888900-52e1adad5474?w=500&q=80',
                reviews: []
            },
            {
                id: 'p6',
                name: 'Coffee Maker',
                price: 129.99,
                description: 'Programmable coffee maker for the perfect brew.',
                category: 'Home & Living',
                imageURL: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500&q=80',
                reviews: []
            }
        ];
        setLocalStorage(PRODUCTS_KEY, seedProducts);
    }

    // Page specific inits
    if (document.getElementById('products-container')) renderProducts();
    if (document.getElementById('cart-items')) renderCart();
    if (document.getElementById('checkout-items')) loadCheckout();
    if (document.getElementById('orders-container')) loadProfile();
});

// --- Checkout Logic ---

function loadCheckout() {
    const container = document.getElementById('checkout-items');
    const totalEl = document.getElementById('checkout-total');
    const countEl = document.getElementById('checkout-count');

    if (!container || !totalEl) return;

    const cart = getLocalStorage(CART_KEY);

    if (cart.length === 0) {
        window.location.href = './cart.html'; // Redirect if empty
        return;
    }

    container.innerHTML = cart.map(item => `
        <li class="list-group-item d-flex justify-content-between lh-sm bg-transparent border-0 px-0">
            <div>
                <h6 class="my-0">${item.productDetails.name}</h6>
                <small class="text-muted">Qty: ${item.quantity}</small>
            </div>
            <span class="text-muted">$${(item.productDetails.price * item.quantity).toFixed(2)}</span>
        </li>
    `).join('');

    const total = getCartTotal();
    totalEl.innerText = '$' + total.toFixed(2);
    countEl.innerText = cart.reduce((sum, item) => sum + item.quantity, 0);
}

function processPayment(event) {
    event.preventDefault();

    const btn = document.getElementById('pay-btn');
    const spinner = document.getElementById('pay-spinner');
    const text = document.getElementById('pay-text');

    // Simulate processing
    btn.disabled = true;
    text.classList.add('d-none');
    spinner.classList.remove('d-none');

    setTimeout(() => {
        // Create Order
        const cart = getLocalStorage(CART_KEY);
        const user = getLoggedInUser();
        const total = getCartTotal();

        const newOrder = {
            id: 'ORD-' + Date.now().toString().slice(-6),
            date: new Date().toISOString(),
            userId: user.email, // Link to user
            items: cart,
            total: total,
            status: 'Processing'
        };

        // Save Order
        const orders = getLocalStorage(ORDERS_KEY);
        orders.push(newOrder);
        setLocalStorage(ORDERS_KEY, orders);

        // Success
        setLocalStorage(CART_KEY, []); // Clear cart
        updateCartBadge();

        const modal = new bootstrap.Modal(document.getElementById('successModal'));
        modal.show();

        btn.disabled = false;
        text.classList.remove('d-none');
        spinner.classList.add('d-none');
    }, 2000);
}

/* ---------- NEW Checkout / Payment Flow ---------- */

/**
 * Called by checkout.html when user clicks "Pay Now".
 * method: 'card' | 'upi' | 'cod'
 */
function handleCheckoutStart(method) {
  const cart = getLocalStorage(CART_KEY);
  if (!cart || cart.length === 0) {
    showToast('Your cart is empty', 'error');
    setTimeout(() => window.location.href = './cart.html', 700);
    return;
  }

  // If COD -> create order immediately
  if (method === 'cod') {
    // create order with COD
    finalizeOrder('COD');
    return;
  }

  // For card / upi -> open simulated gateway
  openPaymentGateway(method);
}

/**
 * Opens the simulated gateway modal and hooks success/failure.
 */
function openPaymentGateway(method) {
  const gatewayModalEl = document.getElementById('gatewayModal');
  const gatewayModal = new bootstrap.Modal(gatewayModalEl);
  const msg = document.getElementById('gateway-msg');
  const spinner = document.getElementById('gateway-spinner');
  const actions = document.getElementById('gateway-actions');

  msg.innerText = `Processing ${method === 'card' ? 'Card' : 'UPI'} payment...`;
  spinner.classList.remove('d-none');
  actions.classList.add('d-none');

  gatewayModal.show();

  // After small delay, show action buttons (simulate redirect to bank)
  setTimeout(() => {
    spinner.classList.add('d-none');
    actions.classList.remove('d-none');
  }, 1200);

  // hookup buttons
  const successBtn = document.getElementById('gateway-success');
  const failBtn = document.getElementById('gateway-fail');

  const onSuccess = () => {
    successBtn.removeEventListener('click', onSuccess);
    failBtn.removeEventListener('click', onFail);
    gatewayModal.hide();
    // finalize order with payment method (simulate gateway success)
    finalizeOrder(method.toUpperCase());
  };

  const onFail = () => {
    successBtn.removeEventListener('click', onSuccess);
    failBtn.removeEventListener('click', onFail);
    gatewayModal.hide();
    showToast('Payment failed. Please try again.', 'error');
  };

  successBtn.addEventListener('click', onSuccess);
  failBtn.addEventListener('click', onFail);
}

/**
 * Finalize the order: create order object, save to orders, clear cart, show success modal.
 * payMethod: string like 'COD' or 'CARD' or 'UPI'
 */
function finalizeOrder(payMethod) {
  const cart = getLocalStorage(CART_KEY);
  const user = getLoggedInUser();
  if (!user) {
    showToast('Please login to place order', 'error');
    setTimeout(() => window.location.href = './index.html', 900);
    return;
  }

  const total = getCartTotal();

  const newOrder = {
    id: 'ORD-' + Date.now().toString().slice(-6),
    date: new Date().toISOString(),
    userId: user.email,
    items: cart,
    total: total,
    paymentMethod: payMethod,
    status: payMethod === 'COD' ? 'Placed (COD)' : 'Paid'
  };

  const orders = getLocalStorage(ORDERS_KEY);
  orders.push(newOrder);
  setLocalStorage(ORDERS_KEY, orders);

  // Clear cart
  setLocalStorage(CART_KEY, []);
  updateCartBadge();

  // Show success modal
  const successModalEl = document.getElementById('orderSuccessModal');
  if (successModalEl) {
    document.getElementById('order-id-span').innerText = newOrder.id;
    const modal = new bootstrap.Modal(successModalEl);
    modal.show();
  } else {
    alert(`Order ${newOrder.id} placed!`);
    window.location.href = 'profile.html';
  }
}


// --- Profile & Orders ---

function loadProfile() {
    const user = getLoggedInUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('profile-name').innerText = user.name;
    document.getElementById('profile-email').innerText = user.email;
    document.getElementById('profile-initial').innerText = user.name.charAt(0).toUpperCase();

    renderOrders(user.email);
}

function renderOrders(userEmail) {
    const container = document.getElementById('orders-container');
    if (!container) return;

    const allOrders = getLocalStorage(ORDERS_KEY);
    // Filter orders for current user
    const userOrders = allOrders.filter(o => o.userId === userEmail).reverse();

    if (userOrders.length === 0) {
        container.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">No orders found.</td></tr>';
        return;
    }

    container.innerHTML = userOrders.map(order => `
        <tr>
            <td><span class="fw-bold text-primary">#${order.id}</span></td>
            <td>${new Date(order.date).toLocaleDateString()}</td>
            <td>$${order.total.toFixed(2)}</td>
            <td><span class="badge bg-info text-dark">${order.status}</span></td>
            <td>
                <small class="text-muted">${order.items.map(i => i.productDetails.name + ' x' + i.quantity).join(', ')}</small>
            </td>
        </tr>
    `).join('');
}

function showToast(message, type = 'success') {
    // Simple toast implementation or use Bootstrap toasts if available
    // For now, let's just log it or alert if critical, but we have a toast container in HTML
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) return;

    const toastHtml = `
        <div class="toast align-items-center text-white bg-${type === 'error' ? 'danger' : 'success'} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    const toastEl = toastContainer.lastElementChild;
    const toast = new bootstrap.Toast(toastEl);
    toast.show();

    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) toggleBtn.innerText = newTheme === 'dark' ? '☀️' : '🌙';
}
// Expose functions to inline scripts (make them global)
window.register = register;
window.login = login;
window.logout = logout;
window.addToCart = addToCart;
window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;

window.buyNow = buyNow;
window.handleCheckoutStart = handleCheckoutStart;
window.openPaymentGateway = openPaymentGateway;
window.finalizeOrder = finalizeOrder;
window.buyNow = buyNow;








