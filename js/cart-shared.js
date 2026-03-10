// ========================================
// SHARED CART LOGIC - Include in all pages
// ========================================

(function() {
    'use strict';

    // Prevent multiple initialization
    if (window.__cartSharedInitialized) {
        console.log('Cart shared already initialized');
        return;
    }
    window.__cartSharedInitialized = true;

    // Cart state
    let cart = [];

    // Dùng 1 key cố định cho toàn bộ website
    const CART_STORAGE_KEY = 'cart_main';

    // Get cart key (shared across all pages)
    function getCartKey() {
        return CART_STORAGE_KEY;
    }

    // Save cart to localStorage
    function saveCart() {
        try {
            localStorage.setItem(getCartKey(), JSON.stringify(cart));
            // Dispatch event to notify other pages
            window.dispatchEvent(new Event('cartUpdated'));
        } catch (e) {
            console.error('Error saving cart:', e);
        }
    }

    // Load cart from localStorage (kèm logic migrate các key cũ nếu có)
    function loadCart() {
        try {
            const key = getCartKey(); // luôn là CART_STORAGE_KEY
            let savedCart = localStorage.getItem(key);

            // Nếu chưa có giỏ với key mới, thử lấy từ các key cũ (cart_guest, cart_{uid})
            if (!savedCart) {
                let legacyItems = [];

                // cart_guest cũ
                const guestCart = localStorage.getItem('cart_guest');
                if (guestCart) {
                    try {
                        legacyItems = legacyItems.concat(JSON.parse(guestCart));
                    } catch (_) {}
                }

                // cart_{uid} cũ (nếu Firebase đã sẵn sàng)
                if (typeof firebase !== 'undefined' && firebase.auth) {
                    const user = firebase.auth().currentUser;
                    if (user) {
                        const userCart = localStorage.getItem(`cart_${user.uid}`);
                        if (userCart) {
                            try {
                                legacyItems = legacyItems.concat(JSON.parse(userCart));
                            } catch (_) {}
                        }
                    }
                }

                // Nếu có dữ liệu cũ thì merge và lưu lại bằng key mới
                if (legacyItems.length > 0) {
                    const merged = {};
                    legacyItems.forEach(item => {
                        if (!item || !item.id) return;
                        if (!merged[item.id]) {
                            merged[item.id] = {
                                id: item.id,
                                name: item.name,
                                price: item.price,
                                image: item.image,
                                quantity: item.quantity || 1
                            };
                        } else {
                            merged[item.id].quantity += item.quantity || 1;
                        }
                    });
                    cart = Object.values(merged);
                    localStorage.setItem(key, JSON.stringify(cart));

                    // Xoá các key cũ để tránh nhầm lẫn về sau
                    localStorage.removeItem('cart_guest');
                    if (typeof firebase !== 'undefined' && firebase.auth) {
                        const user = firebase.auth().currentUser;
                        if (user) {
                            localStorage.removeItem(`cart_${user.uid}`);
                        }
                    }
                    return;
                }
            }

            // Nếu đã có giỏ với key mới thì dùng luôn
            if (savedCart) {
                cart = JSON.parse(savedCart);
            } else {
                cart = [];
            }
        } catch (e) {
            console.error('Error loading cart:', e);
            cart = [];
        }
    }

    // Update cart display (count, badge, dropdown items)
    function updateCartDisplay() {
        const cartBtn = document.querySelector('.btn-cart');
        const cartDropdown = document.querySelector('.cart-dropdown');
        const cartItems = document.querySelector('.cart-items');
        const cartCount = document.querySelector('.cart-count');
        const cartCountBadge = document.querySelector('.cart-count-badge');
        const emptyCart = document.querySelector('.empty-cart');
        const cartSummary = document.querySelector('.cart-summary');
        const cartButtons = document.querySelector('.cart-buttons');

        // If any element is missing, skip update
        if (!cartCount || !cartCountBadge || !emptyCart || !cartSummary || !cartButtons || !cartItems) {
            return;
        }

        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

        // Update count badges
        cartCount.textContent = totalItems;
        cartCountBadge.textContent = `${totalItems} sản phẩm`;

        if (totalItems === 0) {
            emptyCart.style.display = 'block';
            cartSummary.style.display = 'none';
            cartButtons.style.display = 'none';
            cartItems.innerHTML = '';
        } else {
            emptyCart.style.display = 'none';
            cartSummary.style.display = 'block';
            cartButtons.style.display = 'flex';
            renderCartItems();
        }
        updateCartSummary();
    }

    // Format price to VND
    function formatPrice(price) {
        const numPrice = typeof price === 'string' ? parseInt(price.replace(/[^\d]/g, '')) : price;
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numPrice || 0);
    }

    // Render cart items in dropdown
    function renderCartItems() {
        const cartItems = document.querySelector('.cart-items');
        if (!cartItems) return;

        cartItems.innerHTML = cart.map(item => {
            const price = typeof item.price === 'string' ? parseInt(item.price.replace(/[^\d]/g, '')) : item.price;
            return `
                <div class="cart-item" data-id="${item.id}">
                    <img src="${item.image || ''}" alt="${item.name || ''}" class="cart-item-image" onerror="this.src='https://via.placeholder.com/80'">
                    <div class="cart-item-details">
                        <h4 class="cart-item-name">${item.name || ''}</h4>
                        <div class="cart-item-price">${formatPrice(price)}</div>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn minus" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                            <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="99">
                            <button class="quantity-btn plus">+</button>
                        </div>
                    </div>
                    <i class="fas fa-times cart-item-remove"></i>
                </div>
            `;
        }).join('');

        // Add event listeners for quantity buttons
        cartItems.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const item = this.closest('.cart-item');
                const id = item.dataset.id;
                const cartItem = cart.find(i => i.id === id);
                if (!cartItem) return;

                if (this.classList.contains('plus')) {
                    cartItem.quantity++;
                } else if (this.classList.contains('minus') && cartItem.quantity > 1) {
                    cartItem.quantity--;
                }
                updateCartDisplay();
                saveCart();
            });
        });

        // Add event listeners for quantity input
        cartItems.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', function() {
                const item = this.closest('.cart-item');
                const id = item.dataset.id;
                const cartItem = cart.find(i => i.id === id);
                if (!cartItem) return;

                const newQuantity = parseInt(this.value);
                if (newQuantity > 0 && newQuantity < 100) {
                    cartItem.quantity = newQuantity;
                    updateCartDisplay();
                    saveCart();
                } else {
                    this.value = cartItem.quantity;
                }
            });
        });

        // Add event listeners for remove buttons
        cartItems.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', function() {
                const item = this.closest('.cart-item');
                const id = item.dataset.id;
                cart = cart.filter(i => i.id !== id);
                updateCartDisplay();
                saveCart();
            });
        });
    }

    // Update cart summary (subtotal, shipping, total)
    function updateCartSummary() {
        const cartDropdown = document.querySelector('.cart-dropdown');
        if (!cartDropdown) return;

        const summaryRows = cartDropdown.querySelectorAll('.cart-summary-row');
        if (summaryRows.length < 3) return;

        const subtotal = cart.reduce((sum, item) => {
            const price = typeof item.price === 'string' ? parseInt(item.price.replace(/[^\d]/g, '')) : item.price;
            return sum + (price * item.quantity);
        }, 0);
        const shipping = subtotal > 0 ? 30000 : 0;
        const total = subtotal + shipping;

        summaryRows[0].querySelector('span:last-child').textContent = formatPrice(subtotal);
        summaryRows[1].querySelector('span:last-child').textContent = formatPrice(shipping);
        summaryRows[2].querySelector('span:last-child').textContent = formatPrice(total);
    }

    // Add product to cart
    function addToCart(product) {
        const existingItem = cart.find(item => item.id === product.id);
        const price = typeof product.price === 'string' 
            ? parseInt(product.price.replace(/[^\d]/g, '')) 
            : product.price;

        if (existingItem) {
            existingItem.quantity += product.quantity || 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: price,
                image: product.image,
                quantity: product.quantity || 1
            });
        }
        updateCartDisplay();
        saveCart();
    }

    // Toggle cart dropdown
    function toggleCartDropdown(show) {
        const cartDropdown = document.querySelector('.cart-dropdown');
        const cartBtn = document.querySelector('.btn-cart');
        if (!cartDropdown) return;

        if (show === undefined) {
            // Toggle
            cartDropdown.classList.toggle('show');
        } else if (show) {
            cartDropdown.classList.add('show');
        } else {
            cartDropdown.classList.remove('show');
        }
    }

    // Close cart dropdown
    function closeCartDropdown() {
        const cartDropdown = document.querySelector('.cart-dropdown');
        if (cartDropdown) {
            cartDropdown.classList.remove('show');
        }
    }

    // Initialize cart functionality
    function initCart() {
        // Load cart data first
        loadCart();

        const cartBtn = document.querySelector('.btn-cart');
        const cartDropdown = document.querySelector('.cart-dropdown');
        const continueBtn = document.querySelector('.btn-continue');
        const checkoutBtn = document.querySelector('.btn-checkout');

        if (!cartBtn || !cartDropdown) {
            console.warn('Cart elements not found on this page');
            return;
        }

        // Toggle cart dropdown on button click
        cartBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleCartDropdown();
            updateCartDisplay();
        });

        // Prevent dropdown from closing when clicking inside
        cartDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });

        // Close cart when clicking outside
        document.addEventListener('click', function(e) {
            if (!cartDropdown.contains(e.target) && !cartBtn.contains(e.target)) {
                closeCartDropdown();
            }
        });

        // Continue shopping button closes dropdown
        if (continueBtn) {
            continueBtn.addEventListener('click', function() {
                closeCartDropdown();
            });
        }

        // Checkout button redirects to checkout page
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', function() {
                if (cart.length > 0) {
                    window.location.href = 'checkout.html';
                }
            });
        }

        // Listen for storage events to sync cart across tabs
        window.addEventListener('storage', function(e) {
            if (e.key === getCartKey()) {
                cart = JSON.parse(e.newValue || '[]');
                updateCartDisplay();
            }
        });

        // Also listen for custom cart update event
        window.addEventListener('cartUpdated', function() {
            loadCart();
            updateCartDisplay();
        });

        // Initial display update
        updateCartDisplay();

        console.log('Cart initialized with', cart.length, 'items');
    }

    // Make functions globally available
    window.CartUtils = {
        addToCart: addToCart,
        updateCartDisplay: updateCartDisplay,
        getCart: function() { return cart; },
        getCartKey: getCartKey,
        toggleCartDropdown: toggleCartDropdown,
        closeCartDropdown: closeCartDropdown
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCart);
    } else {
        initCart();
    }
})();
