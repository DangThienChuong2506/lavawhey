// Firebase config for reviews database (separate project)
const reviewFirebaseConfig = {
    apiKey: "AIzaSyDH5vZpJNZcJ3JVEXxVzqLqF8vR0wZqj4",
    authDomain: "lavawhey-8a7c6.firebaseapp.com",
    databaseURL: "https://lavawhey-8a7c6-default-rtdb.firebaseio.com",
    projectId: "lavawhey-8a7c6",
    storageBucket: "lavawhey-8a7c6.appspot.com",
    messagingSenderId: "261576736130",
    appId: "1:261576736130:web:9d8b878a50e01c9591a39b",
    measurementId: "G-BR9VJHPJGL"
};

// Initialize Firebase for reviews if not already initialized
let reviewFirebaseInitialized = false;
function initReviewFirebase() {
    if (!firebase.apps.length) {
        firebase.initializeApp(reviewFirebaseConfig);
    }
    reviewFirebaseInitialized = true;
}

// Current product ID for reviews
let currentReviewProductId = null;
let currentUserReview = null;

// Check if user has purchased the product
async function hasUserPurchasedProduct(productId) {
    if (!reviewFirebaseInitialized) initReviewFirebase();
    
    const user = firebase.auth().currentUser;
    if (!user) return false;

    const db = firebase.database();
    const normalizeId = (v) => v != null ? String(v) : '';
    const targetId = normalizeId(productId);
    const userEmailLower = (user.email || '').toLowerCase();

    try {
        const snapshot = await db.ref('invoices').once('value');
        const invoices = snapshot.val();
        if (!invoices) return false;

        for (const [, invoice] of Object.entries(invoices)) {
            const orderEmail = (invoice.customer?.email || invoice.email || '').toLowerCase();
            const orderUserId = invoice.userId || '';

            // Gắn đơn với tài khoản giống như trang lịch sử đơn hàng
            if (orderEmail !== userEmailLower && orderUserId !== user.uid) continue;

            if (!invoice.items || !Array.isArray(invoice.items)) continue;

            const hasProduct = invoice.items.some(item => {
                const id1 = normalizeId(item.id);
                const id2 = normalizeId(item.productId);
                return id1 === targetId || id2 === targetId;
            });

            // Theo yêu cầu: chỉ cần có trong lịch sử là được đánh giá (không lọc trạng thái)
            if (hasProduct) {
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Error checking purchase:', error);
        return false;
    }
}

// Check if user has already reviewed the product
async function hasUserReviewedProduct(productId) {
    if (!reviewFirebaseInitialized) initReviewFirebase();
    
    const user = firebase.auth().currentUser;
    if (!user) return false;

    try {
        const snapshot = await firebase.database().ref('reviews')
            .orderByChild('productId')
            .equalTo(productId)
            .once('value');
        
        const reviews = snapshot.val();
        if (!reviews) return false;

        // Check if current user has reviewed
        for (const [key, review] of Object.entries(reviews)) {
            if (review.userId === user.uid) {
                currentUserReview = { id: key, ...review };
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Error checking review:', error);
        return false;
    }
}

// Get product reviews from Firebase
async function getProductReviews(productId) {
    if (!reviewFirebaseInitialized) initReviewFirebase();
    
    try {
        const snapshot = await firebase.database().ref('reviews')
            .orderByChild('productId')
            .equalTo(productId)
            .once('value');
        
        const reviews = snapshot.val();
        if (!reviews) return [];
        
        // Convert to array and sort by date (newest first)
        const reviewsArray = Object.entries(reviews).map(([key, value]) => ({
            id: key,
            ...value
        }));
        
        reviewsArray.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        return reviewsArray;
    } catch (error) {
        console.error('Error loading reviews:', error);
        return [];
    }
}

// Calculate rating statistics
function calculateRatingStats(reviews) {
    const stats = {
        average: 0,
        total: reviews.length,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
    
    if (reviews.length === 0) return stats;
    
    let sum = 0;
    reviews.forEach(review => {
        const rating = review.rating || 0;
        sum += rating;
        if (rating >= 1 && rating <= 5) {
            stats.distribution[rating]++;
        }
    });
    
    stats.average = (sum / reviews.length).toFixed(1);
    return stats;
}

// Render star display
function renderStars(rating, size = '1rem') {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star" style="color:#ffc107;"></i>';
        } else if (i - 0.5 <= rating) {
            stars += '<i class="fas fa-star-half-alt" style="color:#ffc107;"></i>';
        } else {
            stars += '<i class="far fa-star" style="color:#ddd;"></i>';
        }
    }
    return stars;
}

// Render review form
function renderReviewForm(productId, existingReview = null) {
    const isEdit = !!existingReview;
    const rating = existingReview ? existingReview.rating : 0;
    const content = existingReview ? existingReview.content : '';
    
    return `
        <div class="review-form-container">
            <h3 style="margin-bottom:20px;color:#FF6B00;">${isEdit ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá của bạn'}</h3>
            
            <div class="review-form-group">
                <label>Đánh giá của bạn:</label>
                <div class="star-rating-input">
                    ${[5,4,3,2,1].map(i => `
                        <input type="radio" name="rating" id="star${i}" value="${i}" ${rating === i ? 'checked' : ''} required>
                        <label for="star${i}"><i class="fas fa-star"></i></label>
                    `).join('')}
                </div>
            </div>
            
            <div class="review-form-group">
                <label>Nội dung đánh giá:</label>
                <textarea id="reviewContent" rows="4" placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này...">${content}</textarea>
            </div>
            
            <button type="button" class="submit-review-btn" onclick="submitReview('${productId}', ${isEdit ? `'${existingReview.id}'` : 'null'})" 
                style="padding:12px 30px;background:linear-gradient(135deg,#FF6B00,#FF8533);color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;">
                <i class="fas fa-paper-plane"></i> ${isEdit ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
            </button>
        </div>
    `;
}

// Submit review
async function submitReview(productId, editId = null) {
    if (!reviewFirebaseInitialized) initReviewFirebase();
    
    const user = firebase.auth().currentUser;
    if (!user) {
        Swal.fire('Vui lòng đăng nhập', 'Bạn cần đăng nhập để đánh giá sản phẩm', 'warning');
        return;
    }

    // Strict gate: only users who purchased can create a new review
    const purchased = await hasUserPurchasedProduct(productId);
    if (!purchased && !editId) {
        Swal.fire('Không thể bình luận', 'Bạn cần mua sản phẩm này để có thể bình luận/đánh giá', 'warning');
        return;
    }

    // Get rating
    const ratingInput = document.querySelector('input[name="rating"]:checked');
    if (!ratingInput) {
        Swal.fire('Chưa chọn đánh giá', 'Vui lòng chọn số sao cho sản phẩm', 'warning');
        return;
    }
    const rating = parseInt(ratingInput.value);
    const content = document.getElementById('reviewContent')?.value?.trim() || '';

    try {
        // Get user info
        const userSnapshot = await firebase.database().ref('users').child(user.uid).once('value');
        const userData = userSnapshot.val() || {};
        
        const reviewData = {
            productId: productId,
            userId: user.uid,
            userName: userData.displayName || userData.fullName || user.displayName || 'Khách hàng',
            userPhoto: userData.photoURL || user.photoURL || null,
            rating: rating,
            content: content,
            verifiedPurchase: !!purchased,
            createdAt: Date.now(),
            updatedAt: editId ? Date.now() : null
        };

        if (editId) {
            // Update existing review
            await firebase.database().ref('reviews').child(editId).update(reviewData);
            Swal.fire('Thành công!', 'Đánh giá đã được cập nhật', 'success');
        } else {
            // Create new review
            await firebase.database().ref('reviews').push(reviewData);
            Swal.fire('Cảm ơn!', 'Cảm ơn bạn đã đánh giá sản phẩm', 'success');
        }

        // Reload reviews
        if (typeof loadProductReviews === 'function') {
            loadProductReviews(productId);
        }
        
        // Xóa form inline (nếu đang hiển thị)
        const inline = document.getElementById('inlineReviewEditor');
        if (inline) {
            inline.innerHTML = '';
        }
        
    } catch (error) {
        console.error('Error submitting review:', error);
        Swal.fire('Lỗi!', 'Không thể gửi đánh giá. Vui lòng thử lại.', 'error');
    }
}

// Render reviews list
function renderReviewsList(reviews) {
    if (reviews.length === 0) {
        return `
            <div class="no-reviews">
                <i class="far fa-comment-dots"></i>
                <p>Chưa có đánh giá nào cho sản phẩm này</p>
                <p style="font-size:0.9rem;">Hãy là người đầu tiên đánh giá!</p>
            </div>
        `;
    }

    return reviews.map(review => {
        const date = review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : '';
        const initial = (review.userName || 'K').charAt(0).toUpperCase();
        
        return `
            <div class="review-item">
                <div class="review-author">
                    <div class="review-avatar">${initial}</div>
                    <div class="review-author-info">
                        <div class="review-author-name">
                            ${review.userName || 'Khách hàng'}
                            ${review.verifiedPurchase ? '<span class="verified-badge"><i class="fas fa-check-circle"></i> Đã mua hàng</span>' : ''}
                        </div>
                        <div class="review-date">${date}</div>
                    </div>
                </div>
                <div class="review-stars">${renderStars(review.rating || 0)}</div>
                <div class="review-content">${review.content || ''}</div>
            </div>
        `;
    }).join('');
}

// Load and display product reviews
async function loadProductReviews(productId) {
    currentReviewProductId = productId;
    
    const reviewsSection = document.getElementById('productReviewsSection');
    if (!reviewsSection) {
        console.log('Reviews section not found');
        return;
    }

    // Show loading
    reviewsSection.innerHTML = '<div style="text-align:center;padding:40px;"><i class="fas fa-spinner fa-spin"></i> Đang tải đánh giá...</div>';

    try {
        const reviews = await getProductReviews(productId);
        const stats = calculateRatingStats(reviews);
        
        // Check if user can review
        let canReview = false;
        let hasReviewed = false;
        let showWriteButton = false;
        let showLoginButton = false;
        let showPurchaseLock = false;
        
        const user = firebase.auth().currentUser;
        if (!user) {
            showLoginButton = true;
        } else {
            const purchased = await hasUserPurchasedProduct(productId);
            hasReviewed = await hasUserReviewedProduct(productId);
            canReview = purchased && !hasReviewed;
            showWriteButton = purchased || hasReviewed;
            showPurchaseLock = !purchased && !hasReviewed;
        }

        let html = `
            <div class="reviews-header">
                <h3>Đánh giá sản phẩm</h3>
                <div class="reviews-summary">
                    <div class="overall-rating">
                        <span class="rating-number">${stats.average}</span>
                        <div class="rating-stars-display">${renderStars(parseFloat(stats.average))}</div>
                    </div>
                    <span class="total-reviews-count">(${stats.total} đánh giá)</span>
                </div>
            </div>
        `;

        if (showWriteButton) {
            html += `
                <button class="write-review-btn" onclick="openReviewForm('${productId}')" style="margin-bottom:20px;">
                    <i class="fas fa-pen"></i> ${hasReviewed ? 'Viết lại đánh giá' : 'Viết đánh giá'}
                </button>
            `;
        } else if (showLoginButton) {
            html += `
                <button class="write-review-btn" onclick="Swal.fire('Đăng nhập','Vui lòng đăng nhập để đánh giá','info')" style="margin-bottom:20px;">
                    <i class="fas fa-pen"></i> Đăng nhập để đánh giá
                </button>
            `;
        } else if (showPurchaseLock) {
            html += `
                <div style="margin-bottom:20px;padding:12px 14px;border:1px dashed rgba(255,107,0,0.45);border-radius:10px;background:#fff7ef;color:#8a4b14;font-weight:600;">
                    <i class="fas fa-lock" style="margin-right:8px;"></i>
                    Bạn cần mua sản phẩm này để có thể bình luận/đánh giá.
                </div>
            `;
        }

        // Rating distribution bars
        if (stats.total > 0) {
            html += `<div class="rating-bars">`;
            [5,4,3,2,1].forEach(star => {
                const count = stats.distribution[star] || 0;
                const percent = stats.total > 0 ? (count / stats.total * 100) : 0;
                html += `
                    <div class="rating-bar-row">
                        <span class="rating-bar-label">${star} sao</span>
                        <div class="rating-bar-track">
                            <div class="rating-bar-fill" style="width:${percent}%"></div>
                        </div>
                        <span class="rating-bar-count">${count}</span>
                    </div>
                `;
            });
            html += `</div>`;
        }

        // Reviews list
        html += `<div class="reviews-list">${renderReviewsList(reviews)}</div>`;
        
        reviewsSection.innerHTML = html;

    } catch (error) {
        console.error('Error loading reviews:', error);
        reviewsSection.innerHTML = '<p style="text-align:center;color:red;padding:20px;">Không thể tải đánh giá</p>';
    }
}

// Open inline review form (không dùng modal phủ toàn màn hình nữa)
async function openReviewForm(productId) {
    if (!reviewFirebaseInitialized) initReviewFirebase();
    
    const user = firebase.auth().currentUser;
    if (!user) {
        Swal.fire('Đăng nhập', 'Vui lòng đăng nhập để đánh giá', 'info');
        return;
    }

    // Check if can review
    const hasPurchased = await hasUserPurchasedProduct(productId);
    const hasUserReviewed = await hasUserReviewedProduct(productId);
    
    if (!hasPurchased && !hasUserReviewed) {
        Swal.fire('Không thể đánh giá', 'Bạn cần mua sản phẩm này để có thể đánh giá', 'warning');
        return;
    }

    // Tìm khu vực reviews và chèn form ngay bên dưới tiêu đề
    const reviewsSection = document.getElementById('productReviewsSection');
    if (!reviewsSection) return;

    let inlineContainer = document.getElementById('inlineReviewEditor');
    if (!inlineContainer) {
        inlineContainer = document.createElement('div');
        inlineContainer.id = 'inlineReviewEditor';
        inlineContainer.style.margin = '16px 0 20px 0';

        const header = reviewsSection.querySelector('.reviews-header');
        if (header && header.nextSibling) {
            header.parentNode.insertBefore(inlineContainer, header.nextSibling);
        } else {
            reviewsSection.insertBefore(inlineContainer, reviewsSection.firstChild);
        }
    }

    if (hasUserReviewed && currentUserReview) {
        inlineContainer.innerHTML = renderReviewForm(productId, currentUserReview);
    } else {
        inlineContainer.innerHTML = renderReviewForm(productId);
    }

    // Scroll vào vùng form để user thấy ngay
    inlineContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Get top rated products from reviews DB
async function getTopRatedProducts(limit = 5) {
    if (!reviewFirebaseInitialized) initReviewFirebase();
    
    try {
        const snapshot = await firebase.database().ref('reviews').once('value');
        const reviews = snapshot.val();
        
        if (!reviews) return [];
        
        // Group reviews by product and calculate average
        const productRatings = {};
        Object.values(reviews).forEach(review => {
            if (!productRatings[review.productId]) {
                productRatings[review.productId] = { total: 0, count: 0 };
            }
            productRatings[review.productId].total += review.rating || 0;
            productRatings[review.productId].count++;
        });
        
        // Calculate averages and sort
        const productsWithRating = Object.entries(productRatings)
            .map(([productId, data]) => ({
                productId,
                average: (data.total / data.count).toFixed(1),
                count: data.count
            }))
            .filter(p => p.count >= 1) // At least 1 review
            .sort((a, b) => parseFloat(b.average) - parseFloat(a.average))
            .slice(0, limit);
        
        return productsWithRating;
    } catch (error) {
        console.error('Error getting top rated:', error);
        return [];
    }
}

// Function to add review section to product detail (call this from product detail modal)
function addReviewSectionToProduct(productId) {
    const section = document.getElementById('productReviewsSection');
    if (section) {
        loadProductReviews(productId);
    }
}

// Auto-init Firebase for reviews
if (typeof firebase !== 'undefined') {
    initReviewFirebase();
}

