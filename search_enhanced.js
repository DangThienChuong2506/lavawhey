// Cache cho dữ liệu categories
let cachedCategories = null;

// Hàm lấy dữ liệu từ Firebase
async function layDuLieuCategories() {
    if (cachedCategories) {
        return cachedCategories;
    }
    try {
        const response = await fetch('https://lavawhey-default-rtdb.firebaseio.com/categories.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!data) {
            throw new Error('Không có dữ liệu từ Firebase');
        }

        // Chuyển đổi object thành array
        cachedCategories = Object.entries(data).map(([id, category]) => ({
            id,
            ...category
        }));

        return cachedCategories;
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        return null;
    }
}

// Hàm tìm kiếm sản phẩm với độ liên quan
function timKiemSanPham(categories, tuKhoa) {
    if (!categories || !Array.isArray(categories)) {
        return [];
    }

    tuKhoa = tuKhoa.toLowerCase().trim();
    let ketQua = [];

    categories.forEach(danhMuc => {
        if (danhMuc && danhMuc.products) {
            // Chuyển products thành array nếu là object
            let productsArray = Array.isArray(danhMuc.products)
                ? danhMuc.products
                : Object.entries(danhMuc.products).map(([id, product]) => ({
                    id,
                    ...product
                }));

            productsArray.forEach(sanPham => {
                if (sanPham && sanPham.name) {
                    let doLienQuan = 0;

                    // Tìm theo tên sản phẩm (độ ưu tiên cao nhất)
                    if (sanPham.name.toLowerCase().includes(tuKhoa)) {
                        doLienQuan = 100;
                        // Nếu tên bắt đầu bằng từ khóa, tăng độ liên quan
                        if (sanPham.name.toLowerCase().startsWith(tuKhoa)) {
                            doLienQuan = 150;
                        }
                    }
                    // Tìm theo mô tả sản phẩm
                    else if (sanPham.description && sanPham.description.toLowerCase().includes(tuKhoa)) {
                        doLienQuan = 50;
                    }
                    // Tìm theo tên danh mục
                    else if (danhMuc.name && danhMuc.name.toLowerCase().includes(tuKhoa)) {
                        doLienQuan = 30;
                    }
                    // Tìm theo từng từ trong từ khóa
                    else {
                        const cacTu = tuKhoa.split(' ');
                        cacTu.forEach(tu => {
                            if (tu.length > 2) { // Chỉ tìm từ có độ dài > 2
                                if (sanPham.name.toLowerCase().includes(tu)) {
                                    doLienQuan += 20;
                                }
                                if (sanPham.description && sanPham.description.toLowerCase().includes(tu)) {
                                    doLienQuan += 10;
                                }
                            }
                        });
                    }

                    if (doLienQuan > 0) {
                        ketQua.push({
                            ...sanPham,
                            categoryId: danhMuc.id,
                            categoryName: danhMuc.name,
                            doLienQuan
                        });
                    }
                }
            });
        }
    });

    // Sắp xếp theo độ liên quan giảm dần
    ketQua.sort((a, b) => b.doLienQuan - a.doLienQuan);

    return ketQua;
}

// Hàm hiển thị kết quả tìm kiếm
function hienThiKetQua(ketQua, tuKhoa, searchResults) {
    if (ketQua.length > 0) {
        // Giới hạn hiển thị 10 kết quả
        const ketQuaHienThi = ketQua.slice(0, 10);

        searchResults.innerHTML = ketQuaHienThi.map(sp => `
            <div class="search-item" data-category="${sp.categoryId}" data-product="${sp.id}">
                <div class="category-header">
                    <h3>${sp.categoryName}</h3>
                </div>
                <div class="product-details">
                    <img src="${sp.image}" alt="${sp.name}" onerror="this.src='https://via.placeholder.com/80x80?text=No+Image'">
                    <div class="search-item-info">
                        <h4>${sp.name}</h4>
                        <p>${sp.description || 'Không có mô tả'}</p>
                        <span class="price">${sp.price ? sp.price.toLocaleString() : '0'}đ</span>
                    </div>
                </div>
            </div>
        `).join('');

        if (ketQua.length > 10) {
            searchResults.innerHTML += `
                <div class="search-item view-all-item">
                    <div class="search-item-info" style="text-align: center; width: 100%;">
                        <h4 style="color: var(--primary-color);">
                            <i class="fas fa-arrow-right"></i> 
                            Xem tất cả ${ketQua.length} kết quả
                        </h4>
                    </div>
                </div>
            `;
        }
    } else {
        searchResults.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search" style="font-size: 2rem; color: #ddd; margin-bottom: 10px;"></i>
                <p style="margin: 0; color: #666;">Không tìm thấy sản phẩm phù hợp với "<strong>${tuKhoa}</strong>"</p>
                <p style="margin: 5px 0 0 0; font-size: 0.85rem; color: #999;">Vui lòng thử từ khóa khác</p>
            </div>
        `;
    }
}

// Hàm chuyển đến trang sản phẩm
function chuyenDenTrangSanPham(categoryId, productId, tuKhoa, categories) {
    const danhMucChua = categories.find(dm => dm.id === categoryId);

    sessionStorage.setItem('scrollTarget', JSON.stringify({
        categoryId,
        categoryName: danhMucChua ? danhMucChua.name : '',
        productId,
        searchQuery: tuKhoa,
        showSingleCategory: true,
        autoSelectCategory: true
    }));

    window.location.href = `products.html?category=${categoryId}&search=${encodeURIComponent(tuKhoa)}&product=${productId}&scroll=true&single=true&autoSelect=true`;
}

// Hàm khởi tạo tìm kiếm
function khoiTaoTimKiem() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const searchButton = document.querySelector('.search-button');

    if (!searchInput || !searchResults) {
        console.error('Không tìm thấy elements tìm kiếm');
        return;
    }

    // Tải dữ liệu categories khi trang load
    layDuLieuCategories();

    // Xử lý sự kiện input
    searchInput.addEventListener('input', async function (e) {
        const tuKhoa = e.target.value.trim();

        // Ẩn kết quả nếu input rỗng
        if (!tuKhoa) {
            searchResults.style.display = 'none';
            return;
        }

        // Lấy dữ liệu categories
        const categories = await layDuLieuCategories();
        if (!categories) {
            searchResults.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #ff6b6b; margin-bottom: 10px;"></i>
                    <p>Có lỗi xảy ra khi tải dữ liệu</p>
                </div>
            `;
            searchResults.style.display = 'block';
            return;
        }

        // Tìm kiếm sản phẩm
        const ketQua = timKiemSanPham(categories, tuKhoa);

        // Hiển thị kết quả
        hienThiKetQua(ketQua, tuKhoa, searchResults);
        searchResults.style.display = 'block';

        // Thêm event listeners cho các kết quả tìm kiếm
        document.querySelectorAll('.search-item:not(.view-all-item)').forEach(item => {
            item.addEventListener('click', function () {
                const categoryId = this.dataset.category;
                const productId = this.dataset.product;
                chuyenDenTrangSanPham(categoryId, productId, tuKhoa, categories);
            });
        });

        // Xử lý click vào "Xem tất cả"
        const viewAllItem = document.querySelector('.view-all-item');
        if (viewAllItem) {
            viewAllItem.addEventListener('click', function () {
                // Chuyển đến trang sản phẩm với tất cả kết quả
                sessionStorage.setItem('scrollTarget', JSON.stringify({
                    searchQuery: tuKhoa,
                    showAllResults: true
                }));
                window.location.href = `products.html?search=${encodeURIComponent(tuKhoa)}&scroll=true`;
            });
        }
    });

    // Xử lý sự kiện Enter
    searchInput.addEventListener('keypress', async function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const tuKhoa = searchInput.value.trim();

            if (!tuKhoa) return;

            const categories = await layDuLieuCategories();
            if (!categories) return;

            const ketQua = timKiemSanPham(categories, tuKhoa);

            if (ketQua.length > 0) {
                // Chuyển đến sản phẩm đầu tiên
                chuyenDenTrangSanPham(ketQua[0].categoryId, ketQua[0].id, tuKhoa, categories);
            } else {
                // Hiển thị thông báo không tìm thấy
                searchResults.style.display = 'block';
            }
        }
    });

    // Xử lý click vào nút tìm kiếm
    if (searchButton) {
        searchButton.addEventListener('click', async function (e) {
            e.preventDefault();
            const tuKhoa = searchInput.value.trim();

            if (!tuKhoa) {
                searchInput.focus();
                return;
            }

            const categories = await layDuLieuCategories();
            if (!categories) return;

            const ketQua = timKiemSanPham(categories, tuKhoa);

            if (ketQua.length > 0) {
                // Chuyển đến trang sản phẩm với tất cả kết quả
                sessionStorage.setItem('scrollTarget', JSON.stringify({
                    searchQuery: tuKhoa,
                    showAllResults: true
                }));
                window.location.href = `products.html?search=${encodeURIComponent(tuKhoa)}&scroll=true`;
            } else {
                // Hiển thị thông báo không tìm thấy
                hienThiKetQua([], tuKhoa, searchResults);
                searchResults.style.display = 'block';
            }
        });
    }

    // Ẩn kết quả khi click ra ngoài
    document.addEventListener('click', function (e) {
        if (!searchInput.contains(e.target) &&
            !searchResults.contains(e.target) &&
            !searchButton.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
}

// Khởi tạo khi DOM đã load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', khoiTaoTimKiem);
} else {
    khoiTaoTimKiem();
}
