/**
 * LavaWhey Blog & Gym Knowledge System
 * Handles specialized articles and related product suggestions.
 */

(function () {
    'use strict';

    // --- Helpers ---
    function getDb() {
        return firebase.database();
    }

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

    // --- Initialize Sample Articles ---
    async function initSampleArticles() {
        const db = getDb();
        const snap = await db.ref('news').once('value');
        const existingNews = snap.val();

        // If news already has many items, don't add samples
        if (existingNews && Object.keys(existingNews).length > 2) return;

        const samples = [
            {
                id: 'whey-guide-01',
                title: 'Hướng dẫn dùng Whey Protein hiệu quả nhất cho người mới',
                description: 'Uống Whey lúc nào là tốt nhất? Bao nhiêu muỗng 1 ngày? Tất cả bí quyết để tối ưu hóa việc tăng cơ sẽ có trong bài viết này.',
                image: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
                author: 'Expert Gym',
                date: '2024-03-25',
                tags: ['Dinh Dưỡng', 'Whey Protein', 'Tăng Cơ'],
                content: `
                    <h3>1. Tại sao cần dùng Whey Protein?</h3>
                    <p>Whey Protein là nguồn đạm hấp thụ nhanh, giúp cung cấp axit amin tức thì cho cơ bắp sau khi tập luyện vất vả. Đây là chìa khóa để phục hồi và phát triển mô cơ một cách nhanh nhất.</p>
                    
                    <h3>2. Thời điểm vàng để uống Whey</h3>
                    <ul>
                        <li><strong>Ngay sau khi tập:</strong> Đây là lúc quan trọng nhất. Cơ bắp đang "đói" dưỡng chất và cần đạm để bắt đầu quá trình hồi phục.</li>
                        <li><strong>Ngay sau khi ngủ dậy:</strong> Sau 7-8 tiếng ngủ, cơ thể đang ở trạng thái dị hóa. Một ly Whey sẽ chặn đứng quá trình phá hủy cơ.</li>
                    </ul>

                    <h3>3. Liều lượng hợp lý</h3>
                    <p>Mỗi lần dùng nên là 1 muỗng (khoảng 25-30g protein). Đừng lạm dụng quá nhiều vì cơ thể không thể hấp thụ hết một lúc.</p>
                `,
                relatedProducts: ['whey-gold', 'whey-isolate', 'whey-hydro']
            },
            {
                id: 'gym-plan-01',
                title: 'Lịch tập Gym 5 ngày/tuần dành cho người mới bắt đầu',
                description: 'Bạn mới đi tập và không biết bắt đầu từ đâu? Đây là lịch tập tối ưu nhất để giúp bạn xây dựng nền tảng sức mạnh vững chắc.',
                image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
                author: 'Coach Huy',
                date: '2024-03-24',
                tags: ['Lịch Tập', 'Người Mới', 'Sức Mạnh'],
                content: `
                    <h3>Lịch tập cụ thể:</h3>
                    <ul>
                        <li><strong>Thứ 2:</strong> Ngực & Tay sau (Push Day)</li>
                        <li><strong>Thứ 3:</strong> Lưng & Tay trước (Pull Day)</li>
                        <li><strong>Thứ 4:</strong> Nghỉ ngơi</li>
                        <li><strong>Thứ 5:</strong> Chân & Bụng (Leg Day)</li>
                        <li><strong>Thứ 6:</strong> Vai & Cầu vai</li>
                        <li><strong>Thứ 7:</strong> Cardio nhẹ & Bụng</li>
                        <li><strong>Chủ nhật:</strong> Nghỉ ngơi hoàn toàn</li>
                    </ul>
                    <p>Hãy nhớ khởi động kỹ 10-15 phút trước mỗi buổi tập để tránh chấn thương và tối ưu hóa hiệu suất.</p>
                `,
                relatedProducts: ['whey-gold', 'bcaa-411', 'whey-blend']
            }
        ];

        for (const item of samples) {
            await db.ref('news/' + item.id).set(item);
        }
        console.log('Sample articles initialized.');
    }

    // --- Fetch Related Products ---
    async function fetchRelatedProducts(productIds) {
        if (!productIds || !productIds.length) return [];
        try {
            const db = getDb();
            const snap = await db.ref('categories').once('value');
            const categories = snap.val();
            if (!categories) return [];

            const matched = [];
            categories.forEach(cat => {
                if (cat.products) {
                    cat.products.forEach(p => {
                        if (productIds.includes(p.id)) {
                            matched.push({ ...p, category: cat.name, categoryId: cat.id });
                        }
                    });
                }
            });
            return matched;
        } catch (e) {
            console.error('Error fetching related products:', e);
            return [];
        }
    }

    // --- Render Related Products ---
    async function renderRelatedProducts(productIds, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const products = await fetchRelatedProducts(productIds);
        if (!products.length) {
            container.innerHTML = '';
            return;
        }

        let html = `
            <div class="related-products-section">
                <div class="related-products-title">
                    <i class="fas fa-shopping-cart"></i> Sản phẩm khuyên dùng
                </div>
                <div class="related-products-grid">
        `;

        products.forEach(p => {
            html += `
                <div class="related-product-card" data-pid="${p.id}" data-cid="${p.categoryId}">
                    <img src="${p.image}" alt="${p.name}">
                    <h4>${p.name}</h4>
                    <div class="price">${formatPrice(p.price)}</div>
                    <button class="btn-view-product">Xem chi tiết</button>
                </div>
            `;
        });

        html += `</div></div>`;
        container.innerHTML = html;

        // Add events
        container.querySelectorAll('.related-product-card').forEach(card => {
            card.addEventListener('click', function () {
                const pid = this.dataset.pid;
                const cid = this.dataset.cid;
                // Save target and redirect to products.html
                sessionStorage.setItem('scrollTarget', JSON.stringify({
                    productId: pid,
                    categoryId: cid,
                    autoSelectCategory: true
                }));
                window.location.href = `products.html?product=${pid}&category=${cid}&single=true`;
            });
        });
    }

    // --- Main Integration ---
    window.enhanceBlogDetail = async function (item, containerId) {
        if (item && item.relatedProducts) {
            // Create container if not exists
            const detailContainer = document.getElementById(containerId);
            if (detailContainer) {
                let relatedContainer = document.getElementById('relatedProductsContainer');
                if (!relatedContainer) {
                    relatedContainer = document.createElement('div');
                    relatedContainer.id = 'relatedProductsContainer';
                    detailContainer.appendChild(relatedContainer);
                }
                renderRelatedProducts(item.relatedProducts, 'relatedProductsContainer');
            }
        }
    };

    // Auto-init samples on load
    document.addEventListener('DOMContentLoaded', () => {
        initSampleArticles();
    });

})();
