/**
 * LavaWhey Product Review & Rating System
 * Lưu trữ đánh giá trên Firebase Realtime Database
 * Path: /reviews/{productId}/{reviewId}
 */

(function () {
    'use strict';

    // --- Helpers ---
    function getDb() {
        return firebase.database();
    }

    function getAuth() {
        return firebase.auth();
    }

    function renderStars(rating, maxStars = 5) {
        let html = '';
        for (let i = 1; i <= maxStars; i++) {
            if (i <= Math.floor(rating)) {
                html += '<i class="fas fa-star"></i>';
            } else if (i - rating < 1 && i - rating > 0) {
                html += '<i class="fas fa-star-half-alt"></i>';
            } else {
                html += '<i class="far fa-star"></i>';
            }
        }
        return html;
    }

    function formatReviewDate(timestamp) {
        const d = new Date(timestamp);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // --- Check if user purchased a product ---
    async function userPurchasedProduct(userId, productId) {
        const db = getDb();
        const auth = getAuth();
        const currentUser = auth.currentUser;
        const normalizeId = (v) => v != null ? String(v) : '';
        const targetId = normalizeId(productId);
        const userEmailLower = (currentUser?.email || '').toLowerCase();

        try {
            const invoiceSnap = await db.ref('invoices').once('value');
            const invoices = invoiceSnap.val();
            if (!invoices) return false;

            for (const [, invoice] of Object.entries(invoices)) {
                const orderEmail = (invoice.customer?.email || invoice.email || '').toLowerCase();
                const orderUserId = invoice.userId || '';

                // Match theo lịch sử đơn hàng: cùng email hoặc cùng userId
                if (orderEmail !== userEmailLower && orderUserId !== userId) continue;

                if (!invoice.items || !Array.isArray(invoice.items)) continue;

                const hasProduct = invoice.items.some(item => {
                    const id1 = normalizeId(item.id);
                    const id2 = normalizeId(item.productId);
                    return id1 === targetId || id2 === targetId;
                });

                // Chỉ cần có trong lịch sử đơn hàng là cho phép đánh giá
                if (hasProduct) return true;
            }

            return false;
        } catch (e) {
            console.error('Error checking purchase:', e);
            return false;
        }
    }

    // --- Load all reviews for a product ---
    async function loadReviews(productId) {
        try {
            const snap = await getDb().ref('reviews/' + productId).once('value');
            const data = snap.val();
            if (!data) return [];
            return Object.keys(data).map(k => ({ id: k, ...data[k] }));
        } catch (e) {
            console.error('Error loading reviews:', e);
            return [];
        }
    }

    // --- Calculate review stats ---
    function calcStats(reviews) {
        if (!reviews.length) return { avg: 0, total: 0, bars: [0, 0, 0, 0, 0] };
        let sum = 0;
        const bars = [0, 0, 0, 0, 0];
        reviews.forEach(r => {
            sum += r.rating;
            bars[r.rating - 1]++;
        });
        return {
            avg: (sum / reviews.length).toFixed(1),
            total: reviews.length,
            bars // [1*, 2*, 3*, 4*, 5*]
        };
    }

    // --- Render Review Summary ---
    function renderSummary(stats, container) {
        const maxBar = Math.max(...stats.bars, 1);
        let barsHtml = '';
        for (let i = 5; i >= 1; i--) {
            const count = stats.bars[i - 1];
            const pct = (count / maxBar) * 100;
            barsHtml += `
                <div class="review-bar-row">
                    <span class="bar-label">${i} <i class="fas fa-star" style="color:#FFB300;font-size:0.75rem"></i></span>
                    <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
                    <span class="bar-count">${count}</span>
                </div>`;
        }
        container.innerHTML = `
            <div class="review-avg">
                <div class="avg-number">${stats.total > 0 ? stats.avg : '—'}</div>
                <div class="avg-stars">${renderStars(stats.avg)}</div>
                <div class="avg-count">${stats.total} đánh giá</div>
            </div>
            <div class="review-bars">${barsHtml}</div>
        `;
    }

    // --- Render Review Form ---
    function renderForm(container, productId, user, hasPurchased) {
        if (!user) {
            container.innerHTML = `
                <div class="review-login-prompt">
                    <i class="fas fa-user-lock"></i>
                    Vui lòng <a onclick="document.getElementById('loginModal') && (document.getElementById('loginModal').classList.add('show'))">đăng nhập</a> để đánh giá sản phẩm.
                </div>`;
            return;
        }
        if (!hasPurchased) {
            container.innerHTML = `
                <div class="review-login-prompt">
                    <i class="fas fa-shopping-bag"></i>
                    Bạn cần mua sản phẩm này để có thể đánh giá.
                </div>`;
            return;
        }
        container.innerHTML = `
            <div class="review-form-section">
                <h4><i class="fas fa-pen-fancy"></i> Viết đánh giá của bạn</h4>
                <div class="star-rating-input" id="starRatingInput">
                    <input type="radio" id="star5" name="rating" value="5"><label for="star5"><i class="fas fa-star"></i></label>
                    <input type="radio" id="star4" name="rating" value="4"><label for="star4"><i class="fas fa-star"></i></label>
                    <input type="radio" id="star3" name="rating" value="3" checked><label for="star3"><i class="fas fa-star"></i></label>
                    <input type="radio" id="star2" name="rating" value="2"><label for="star2"><i class="fas fa-star"></i></label>
                    <input type="radio" id="star1" name="rating" value="1"><label for="star1"><i class="fas fa-star"></i></label>
                </div>
                <textarea class="review-textarea" id="reviewComment" placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..." maxlength="500"></textarea>
                <button class="btn-submit-review" id="btnSubmitReview">
                    <i class="fas fa-paper-plane"></i> Gửi đánh giá
                </button>
            </div>`;

        // Submit event
        document.getElementById('btnSubmitReview').addEventListener('click', async function () {
            const rating = parseInt(document.querySelector('#starRatingInput input[name="rating"]:checked')?.value || 3);
            const comment = document.getElementById('reviewComment').value.trim();
            if (!comment) {
                Swal.fire({ icon: 'warning', title: 'Vui lòng nhập bình luận', timer: 1500, showConfirmButton: false });
                return;
            }
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';
            try {
                await getDb().ref('reviews/' + productId).push({
                    userId: user.uid,
                    userName: user.displayName || user.email?.split('@')[0] || 'Ẩn danh',
                    userPhoto: user.photoURL || '',
                    rating: rating,
                    comment: comment,
                    createdAt: new Date().toISOString(),
                    verified: true
                });
                Swal.fire({
                    icon: 'success',
                    title: 'Cảm ơn bạn đã đánh giá!',
                    text: 'Đánh giá của bạn đã được ghi nhận.',
                    timer: 2000,
                    showConfirmButton: false
                });
                // Reload reviews
                if (window._currentReviewProductId === productId) {
                    window.loadProductReviews(productId);
                }
            } catch (e) {
                Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể gửi đánh giá. Vui lòng thử lại.' });
                this.disabled = false;
                this.innerHTML = '<i class="fas fa-paper-plane"></i> Gửi đánh giá';
            }
        });
    }

    // --- Render Review List ---
    function renderList(reviews, container) {
        if (!reviews.length) {
            container.innerHTML = `
                <div class="review-empty">
                    <i class="far fa-comment-dots"></i>
                    Chưa có đánh giá nào cho sản phẩm này.
                </div>`;
            return;
        }
        // Sort by date desc
        reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        let html = '';
        reviews.forEach(r => {
            const avatarSrc = r.userPhoto || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(r.userName || 'U') + '&background=FF6B00&color=fff&size=80';
            html += `
                <div class="review-item">
                    <div class="review-item-header">
                        <img class="review-avatar" src="${avatarSrc}" alt="${r.userName}" onerror="this.src='https://ui-avatars.com/api/?name=U&background=FF6B00&color=fff&size=80'">
                        <div class="review-user-info">
                            <div class="review-user-name">${r.userName || 'Ẩn danh'}</div>
                            <div class="review-user-date">${formatReviewDate(r.createdAt)}</div>
                        </div>
                        <div class="review-stars">${renderStars(r.rating)}</div>
                    </div>
                    <div class="review-comment">${r.comment}</div>
                    ${r.verified ? '<div class="review-verified"><i class="fas fa-check-circle"></i> Đã mua hàng</div>' : ''}
                </div>`;
        });
        container.innerHTML = `
            <div class="review-list-section">
                <h4><i class="fas fa-comments"></i> Đánh giá từ khách hàng (${reviews.length})</h4>
                <div class="review-list">${html}</div>
            </div>`;
    }

    // --- Main: Load reviews for product modal ---
    window.loadProductReviews = async function (productId) {
        window._currentReviewProductId = productId;

        // Find/create containers
        let summaryEl = document.getElementById('reviewSummary');
        let formEl = document.getElementById('reviewFormContainer');
        let listEl = document.getElementById('reviewListContainer');

        if (!summaryEl || !formEl || !listEl) return;

        // Loading state
        summaryEl.innerHTML = '<div style="text-align:center;padding:10px;color:#aaa"><i class="fas fa-spinner fa-spin"></i> Đang tải đánh giá...</div>';
        formEl.innerHTML = '';
        listEl.innerHTML = '';

        const reviews = await loadReviews(productId);
        const stats = calcStats(reviews);

        renderSummary(stats, summaryEl);
        renderList(reviews, listEl);

        // Check auth & purchase for form
        const user = getAuth().currentUser;
        if (user) {
            const hasPurchased = await userPurchasedProduct(user.uid, productId);
            renderForm(formEl, productId, user, hasPurchased);
        } else {
            renderForm(formEl, productId, null, false);
        }
    };

    // --- Top Rated Products (for index.html) ---
    window.fetchTopRatedProducts = async function () {
        try {
            const db = getDb();

            // Load all categories & products
            const catSnap = await db.ref('categories').once('value');
            const categories = catSnap.val();
            if (!categories || !Array.isArray(categories)) return [];

            // Build flat product list
            const allProducts = [];
            categories.forEach(cat => {
                if (cat.products && Array.isArray(cat.products)) {
                    cat.products.forEach(p => {
                        allProducts.push({ ...p, category: cat.name, categoryId: cat.id });
                    });
                }
            });

            // Load all reviews
            const reviewSnap = await db.ref('reviews').once('value');
            const allReviews = reviewSnap.val() || {};

            // Calculate avg rating per product
            const productsWithRating = allProducts.map(p => {
                const reviews = allReviews[p.id];
                let avg = 0, total = 0;
                if (reviews) {
                    const arr = Object.values(reviews);
                    total = arr.length;
                    avg = arr.reduce((s, r) => s + r.rating, 0) / total;
                }
                return { ...p, avgRating: avg, totalReviews: total };
            });

            // Sort by avg rating (desc), then by total reviews (desc)
            productsWithRating.sort((a, b) => {
                if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
                return b.totalReviews - a.totalReviews;
            });

            // Return top 12 with at least 1 review
            return productsWithRating.filter(p => p.totalReviews > 0).slice(0, 12);
        } catch (e) {
            console.error('Error fetching top rated:', e);
            return [];
        }
    };

    // --- Render Top Rated on Index ---
    window.renderTopRatedSection = async function () {
        const grid = document.getElementById('topRatedGrid');
        if (!grid) return;

        const prevBtn = document.getElementById('topRatedPrev');
        const nextBtn = document.getElementById('topRatedNext');

        grid.innerHTML = '<div class="top-rated-loading" style="width:100%"><i class="fas fa-spinner fa-spin"></i> Đang tải sản phẩm được đánh giá cao...</div>';

        const products = await window.fetchTopRatedProducts();

        if (!products.length) {
            const section = document.getElementById('topRatedSection');
            if (section) section.style.display = 'none';
            return;
        }
        {
            const section = document.getElementById('topRatedSection');
            if (section) section.style.display = 'block';
        }

        const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

        grid.innerHTML = '';
        products.forEach((p, idx) => {
            const card = document.createElement('div');
            card.className = 'top-rated-card';
            card.innerHTML = `
                ${idx < 3 ? `<div class="card-badge"><i class="fas fa-trophy"></i> Top ${idx + 1}</div>` : ''}
                <img class="card-img" data-image-raw="${String(p.image || '').replace(/"/g, '&quot;')}" src="${(typeof window.getSafeImage === 'function') ? window.getSafeImage(p.image) : (p.image || 'https://via.placeholder.com/260x220?text=No+Image')}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/260x220?text=No+Image'">
                <div class="card-body">
                    <div class="card-name">${p.name}</div>
                    <div class="card-rating">
                        <span class="stars">${window._renderStarsGlobal(p.avgRating)}</span>
                        <span class="rating-text">${p.avgRating.toFixed(1)} (${p.totalReviews} đánh giá)</span>
                    </div>
                    <div class="card-price">${formatPrice(p.price)}</div>
                    <div class="card-category">${p.category}</div>
                </div>`;
            card.addEventListener('click', function () {
                sessionStorage.setItem('scrollTarget', JSON.stringify({
                    productId: p.id,
                    categoryId: p.categoryId,
                    autoSelectCategory: true
                }));
                window.location.href = 'products.html?product=' + p.id + '&category=' + p.categoryId + '&single=true';
            });
            grid.appendChild(card);
        });

        // Resolve Firebase Storage images if helper exists on this page
        if (typeof window.hydrateImages === 'function') {
            try { await window.hydrateImages(grid); } catch (_) {}
        }

        // --- Carousel Logic ---
        let currentIndex = 0;
        const totalProducts = products.length;

        function getCardsPerView() {
            if (window.innerWidth > 992) return 3; // keep Top 1–3 visible on desktop
            if (window.innerWidth > 768) return 2;
            return 1;
        }

        function updateSlider() {
            const cardsPerView = getCardsPerView();
            const maxIndex = Math.max(0, totalProducts - cardsPerView);

            if (currentIndex > maxIndex) currentIndex = maxIndex;
            if (currentIndex < 0) currentIndex = 0;

            const cardWidth = grid.querySelector('.top-rated-card')?.offsetWidth || 0;
            const gap = 28;
            const offset = currentIndex * (cardWidth + gap);

            grid.style.transform = `translateX(-${offset}px)`;

            // Update button states
            if (prevBtn) prevBtn.disabled = currentIndex === 0;
            if (nextBtn) nextBtn.disabled = currentIndex >= maxIndex;

            // Hide buttons if all products fit in one view
            if (totalProducts <= cardsPerView) {
                if (prevBtn) prevBtn.style.display = 'none';
                if (nextBtn) nextBtn.style.display = 'none';
            } else {
                if (prevBtn) prevBtn.style.display = 'flex';
                if (nextBtn) nextBtn.style.display = 'flex';
            }
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const cardsPerView = getCardsPerView();
                currentIndex = Math.max(0, currentIndex - cardsPerView);
                updateSlider();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const cardsPerView = getCardsPerView();
                const maxIndex = Math.max(0, totalProducts - cardsPerView);
                currentIndex = Math.min(maxIndex, currentIndex + cardsPerView);
                updateSlider();
            });
        }

        // Initialize and handle resize
        window.addEventListener('resize', updateSlider);

        // Use a small timeout to ensure cards are rendered and width is calculated correctly
        setTimeout(updateSlider, 500);
    };

    // Expose renderStars globally for top rated section
    window._renderStarsGlobal = renderStars;

})();
