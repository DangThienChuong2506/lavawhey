// Add safe image checker 
function getSafeImage(url) {
    if (!url) return 'https://via.placeholder.com/200x200?text=No+Image';
    // Sửa lại ảnh lỗi từ Bing bằng ảnh Whey chuẩn của LavaWhey
    if (url.includes('th.bing.com')) return 'https://suckhoehangngay.mediacdn.vn/thumb_w/600/154880486097817600/2020/8/10/20190829063758523105whey-protein-la-gimax-800x800-15970551551471580098420-0-25-468-774-crop-1597055170642656384816.png';
    return url;
}

// Global Filter State
window.currentFilters = {
    category: 'all',
    goal: null,
    minPrice: 0,
    maxPrice: 5000000,
    search: ''
};

const GOAL_KEYWORDS = {
    // Tăng cơ: Whey Protein + Vitamin và Khoáng chất
    'muscle': [
        // Whey Protein
        'whey', 'protein', 'iso', 'isolate', 'hydrolyzed', 'concentrate',
        'gold standard', 'impact', 'platinum', 'syntha', 'optimum',
        'myprotein', 'bsn', 'dymatize', 'muscletech', 'cellucor', 'evl', 'rule1',
        'premium whey', 'elite whey', 'pro whey', 'ultra whey', 'max whey',
        'native whey', 'cold processed', 'micellar', 'whey gold',
        // Vitamin & Khoáng chất
        'vitamin', 'khoáng chất', 'multivitamin', 'vitamin d', 'vitamin c',
        'zinc', 'magnesium', 'iron', 'calcium', 'vitamin b',
        'omega', 'dầu cá', 'fish oil', 'khoáng'
    ],
    // Giảm mỡ: Sản phẩm giảm cân
    'fat-loss': [
        // Giảm cân
        'giảm cân', 'giảm béo', 'giảm mỡ', 'weight loss', 'fat loss',
        'slim', 'shred', 'cut', 'lean', 'đánh tan mỡ',
        // Fat Burner
        'burner', 'fat burner', 'fatburner', 'đốt mỡ',
        'thermo', 'thermogenic', 'ripped', 'shredded',
        // L-Carnitine
        'carnitine', 'l-carnitine',
        // CLA
        'cla', 'conjugated linoleic acid',
        // Giảm cân khác
        'green tea', 'egcg', 'coffee', 'caffeine', 'appetite',
        'carb blocker', 'fat blocker', 'hca', 'garcinia', 'ketone',
        'raspberry ketone', 'green coffee', 'forskolin', 'coleus', 'yohimbe',
        'mct', 'hydroxycut', 'phenq', 'prime shred'
    ],
    // Tăng sức bền: BCAA và Pre-workout
    'endurance': [
        // BCAA
        'bcaa', 'branched chain amino',
        // Pre-workout
        'pre-workout', 'pre workout', 'preworkout', 'pre'
    ]
};

// Hàm định dạng giá chuẩn Việt Nam
function formatPrice(price) {
    const number = typeof price === 'string' ? parseInt(price.replace(/[^\d]/g, '')) : price;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number || 0);
}

const DEFAULT_MIN_PRICE = 0;
const DEFAULT_MAX_PRICE = 5000000;

function setSidebarActiveCategory(categoryId) {
    document.querySelectorAll('.category-list a').forEach(a => a.classList.remove('active'));
    const link = document.querySelector(`.category-list a[data-category="${categoryId}"]`);
    if (link) link.classList.add('active');
}

function isSmartFilterActive() {
    const { goal, minPrice, maxPrice, search } = window.currentFilters;
    const hasGoal = !!goal;
    const hasPrice = (minPrice !== DEFAULT_MIN_PRICE) || (maxPrice !== DEFAULT_MAX_PRICE);
    const hasSearch = (search || '').trim().length > 0;
    return hasGoal || hasPrice || hasSearch;
}

// Lấy dữ liệu và đồng bộ hóa Category - dùng DOM trực tiếp thay vì truy vấn Firebase lại
// NOTE: Khi bộ lọc thông minh active, nó sẽ hiển thị theo kết quả lọc (bỏ qua lựa chọn danh mục).
async function applySmartFilter() {
    try {
        const { goal, minPrice, maxPrice, search } = window.currentFilters;
        const searchKW = search.toLowerCase().trim();
        let totalVisible = 0;
        const smartActive = isSmartFilterActive();

        // Lấy tất cả các category element từ DOM
        const allCategoryElements = document.querySelectorAll('.product-category');

        // Khi bật smart filter: luôn show tất cả danh mục trước, rồi ẩn theo kết quả lọc
        if (smartActive) {
            window.currentFilters.category = 'all';
            setSidebarActiveCategory('all');
            allCategoryElements.forEach(el => { el.style.display = 'block'; });
        }

        allCategoryElements.forEach(categoryElement => {
            let hasVisibleProducts = false;
            const productCards = categoryElement.querySelectorAll('.product-card');
            const categoryTitle = (categoryElement.querySelector('h2')?.textContent || '').toLowerCase();

            // Chế độ goal filter
            let goalMatchCategory = true;
            if (goal) {
                if (goal === 'muscle') {
                    goalMatchCategory = categoryTitle.includes('whey') || categoryTitle.includes('vitamin') || categoryTitle.includes('khoáng');
                } else if (goal === 'fat-loss') {
                    goalMatchCategory = categoryTitle.includes('giảm cân') || categoryTitle.includes('giảm mỡ');
                } else if (goal === 'endurance') {
                    goalMatchCategory = categoryTitle.includes('bcaa') || categoryTitle.includes('pre-workout');
                }
            }

            productCards.forEach(card => {
                const pName = card.querySelector('h3')?.textContent?.toLowerCase() || '';
                const pDesc = card.querySelector('.description')?.textContent?.toLowerCase() || '';
                const pPriceText = card.querySelector('.price')?.textContent || '0';

                // Parse price từ data-attribute hoặc text (fallback)
                const price = parseInt(card.getAttribute('data-price')) || parseInt(pPriceText.replace(/[^\d]/g, '')) || 0;

                // 1. Lọc Giá
                const priceMatch = price >= minPrice && price <= maxPrice;

                // 2. Lọc Mục tiêu & Tìm kiếm
                const fullText = (card.getAttribute('data-search-full') || (pName + ' ' + pDesc)).toLowerCase();

                let goalMatch = true;
                if (goal) {
                    // Nếu danh mục đã đúng nhóm mục tiêu thì cho phép toàn bộ sản phẩm trong danh mục
                    goalMatch = goalMatchCategory || GOAL_KEYWORDS[goal].some(kw => fullText.includes(kw));
                }

                const searchMatch = !searchKW || fullText.includes(searchKW);

                if (priceMatch && goalMatch && searchMatch) {
                    card.style.display = '';
                    hasVisibleProducts = true;
                    totalVisible++;
                } else {
                    card.style.display = 'none';
                }
            });

            // Nếu smart filter đang bật: ẩn toàn bộ danh mục không có sản phẩm phù hợp
            if (smartActive) {
                categoryElement.style.display = hasVisibleProducts ? 'block' : 'none';
            }
        });

        // Hiển thị trạng thái khi không có sản phẩm phù hợp
        handleEmptyResults(totalVisible === 0);
    } catch (e) { console.error(e); }
}

// Hàm hiển thị/ẩn danh mục theo sidebar (độc lập với bộ lọc thông minh)
function applyCategoryFilter() {
    const { category: selCat } = window.currentFilters;
    const allCategoryElements = document.querySelectorAll('.product-category');

    allCategoryElements.forEach(categoryElement => {
        const catId = categoryElement.getAttribute('data-category');
        const isCatMatch = selCat === 'all' || selCat === catId;

        // Hiện/ẩn toàn bộ danh mục
        categoryElement.style.display = isCatMatch ? 'block' : 'none';

        // Reset hiển thị tất cả sản phẩm trong danh mục (bỏ lọc goal/price)
        if (isCatMatch) {
            const productCards = categoryElement.querySelectorAll('.product-card');
            productCards.forEach(card => {
                card.style.display = '';
            });
        }
    });

    // Ẩn thông báo empty khi chuyển danh mục
    handleEmptyResults(false);
}

function resetSmartFiltersKeepCategory() {
    window.currentFilters.goal = null;
    window.currentFilters.minPrice = DEFAULT_MIN_PRICE;
    window.currentFilters.maxPrice = DEFAULT_MAX_PRICE;
    window.currentFilters.search = '';

    document.querySelectorAll('.goal-btn').forEach(btn => btn.classList.remove('active'));

    const minS = document.getElementById('minPriceRange');
    const maxS = document.getElementById('maxPriceRange');
    if (minS) minS.value = DEFAULT_MIN_PRICE;
    if (maxS) maxS.value = DEFAULT_MAX_PRICE;

    const minDisplay = document.getElementById('minPriceValue');
    const maxDisplay = document.getElementById('maxPriceValue');
    if (minDisplay) minDisplay.textContent = formatPrice(DEFAULT_MIN_PRICE);
    if (maxDisplay) maxDisplay.textContent = formatPrice(DEFAULT_MAX_PRICE);

    const track = document.getElementById('sliderTrack');
    if (track && minS && maxS) {
        const p1 = (minS.value / minS.max) * 100;
        const p2 = (maxS.value / maxS.max) * 100;
        track.style.setProperty('--range-min', `${p1}%`);
        track.style.setProperty('--range-max', `${p2}%`);
    }
}

// Hiển thị / ẩn thông báo khi không có sản phẩm sau khi lọc
function handleEmptyResults(isEmpty) {
    const productsGrid = document.querySelector('.products-grid');
    if (!productsGrid) return;

    let emptyNode = productsGrid.querySelector('.empty-state');

    if (isEmpty) {
        if (!emptyNode) {
            emptyNode = document.createElement('div');
            emptyNode.className = 'empty-state';
            emptyNode.innerHTML = `
                <i class="fas fa-box-open"></i>
                <p>Không tìm thấy sản phẩm phù hợp với bộ lọc hiện tại.</p>
            `;
            productsGrid.appendChild(emptyNode);
        }
    } else if (emptyNode) {
        emptyNode.remove();
    }
}

// Khởi tạo các sự kiện điều khiển
function initSmartFilters() {
    // Goal Buttons
    document.querySelectorAll('.goal-btn').forEach(btn => {
        btn.onclick = function () {
            const isTargetActive = this.classList.contains('active');
            document.querySelectorAll('.goal-btn').forEach(b => b.classList.remove('active'));

            if (!isTargetActive) {
                this.classList.add('active');
                window.currentFilters.goal = this.dataset.goal;
            } else {
                window.currentFilters.goal = null;
            }
            applySmartFilter();
        };
    });

    // Price Quick Select Buttons
    document.querySelectorAll('.price-btn').forEach(btn => {
        btn.onclick = function () {
            const min = parseInt(this.dataset.min);
            const max = parseInt(this.dataset.max);

            // Update range inputs
            const minS = document.getElementById('minPriceRange');
            const maxS = document.getElementById('maxPriceRange');
            if (minS && maxS) {
                minS.value = min;
                maxS.value = max > minS.max ? minS.max : max;

                // Trigger update UI
                minS.dispatchEvent(new Event('input'));
                maxS.dispatchEvent(new Event('input'));
            }

            // UI active state
            document.querySelectorAll('.price-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        };
    });

    // Price Sliders
    const minS = document.getElementById('minPriceRange');
    const maxS = document.getElementById('maxPriceRange');
    if (minS && maxS) {
        const updateSliders = () => {
            if (parseInt(minS.value) >= parseInt(maxS.value)) minS.value = maxS.value - 50000;
            document.getElementById('minPriceValue').textContent = formatPrice(minS.value);
            document.getElementById('maxPriceValue').textContent = formatPrice(maxS.value);
            window.currentFilters.minPrice = parseInt(minS.value);
            window.currentFilters.maxPrice = parseInt(maxS.value);

            // Cập nhật thanh Track (nếu có)
            const track = document.getElementById('sliderTrack');
            if (track) {
                const p1 = (minS.value / minS.max) * 100;
                const p2 = (maxS.value / maxS.max) * 100;
                track.style.setProperty('--range-min', `${p1}%`);
                track.style.setProperty('--range-max', `${p2}%`);
            }
            applySmartFilter();
        };
        minS.oninput = updateSliders;
        maxS.oninput = updateSliders;
    }

    // Category Sidebar Integration - Dùng applyCategoryFilter để hiện/ẩn danh mục và reset bộ lọc
    const categoryList = document.querySelector('.category-list');
    if (categoryList) {
        // Sử dụng Event Delegation để tránh lỗi khi Category render động
        categoryList.addEventListener('click', function (e) {
            const link = e.target.closest('a');
            if (!link) return;
            e.preventDefault();

            document.querySelectorAll('.category-list a').forEach(a => a.classList.remove('active'));
            link.classList.add('active');

            window.currentFilters.category = link.getAttribute('data-category');
            // Khi người dùng quay lại danh mục: tắt bộ lọc thông minh để hiện sản phẩm bình thường
            resetSmartFiltersKeepCategory();
            // Dùng applyCategoryFilter để hiện/ẩn danh mục và reset sản phẩm
            applyCategoryFilter();
        });
    }

    // Xử lý URL parameters (nếu có search hoặc category)
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    const categoryParam = urlParams.get('category');

    if (searchParam) {
        window.currentFilters.search = searchParam;
        applySmartFilter();
    } else if (categoryParam) {
        window.currentFilters.category = categoryParam;
        setSidebarActiveCategory(categoryParam);
        applyCategoryFilter();
    }
}

document.addEventListener('DOMContentLoaded', initSmartFilters);

// Xóa tất cả bộ lọc
function clearAllFilters() {
    // Reset filter state
    window.currentFilters = {
        category: 'all',
        goal: null,
        minPrice: DEFAULT_MIN_PRICE,
        maxPrice: DEFAULT_MAX_PRICE,
        search: ''
    };

    // Reset UI - Goal buttons
    document.querySelectorAll('.goal-btn').forEach(btn => btn.classList.remove('active'));

    // Reset UI - Price sliders
    const minS = document.getElementById('minPriceRange');
    const maxS = document.getElementById('maxPriceRange');
    if (minS) minS.value = DEFAULT_MIN_PRICE;
    if (maxS) maxS.value = DEFAULT_MAX_PRICE;

    // Update price display
    const minDisplay = document.getElementById('minPriceValue');
    const maxDisplay = document.getElementById('maxPriceValue');
    if (minDisplay) minDisplay.textContent = formatPrice(DEFAULT_MIN_PRICE);
    if (maxDisplay) maxDisplay.textContent = formatPrice(DEFAULT_MAX_PRICE);

    // Reset slider track
    const track = document.getElementById('sliderTrack');
    if (track) {
        track.style.setProperty('--range-min', '0%');
        track.style.setProperty('--range-max', '100%');
    }

    // Reset category sidebar
    document.querySelectorAll('.category-list a').forEach(a => a.classList.remove('active'));
    const allLink = document.querySelector('.category-list a[data-category="all"]');
    if (allLink) allLink.classList.add('active');

    // Apply filter - dùng applyCategoryFilter để hiện tất cả danh mục và reset sản phẩm
    applyCategoryFilter();
}