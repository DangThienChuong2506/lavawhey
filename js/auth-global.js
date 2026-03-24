
// Add safe image checker 
function getSafeImage(url) {
    if (!url) return 'https://via.placeholder.com/200x200?text=No+Image';
    if (url.includes('th.bing.com')) return 'https://suckhoehangngay.mediacdn.vn/thumb_w/600/154880486097817600/2020/8/10/20190829063758523105whey-protein-la-gimax-800x800-15970551551471580098420-0-25-468-774-crop-1597055170642656384816.png';
    return url;
}

/**
 * LavaWhey Global Auth Manager
 * Handles login/register modals, auth state, and UI updates across all pages.
 */

(function () {
    // Flag to prevent page-level duplicate auth handlers
    window.__lavawheyAuthGlobal = true;

    // --- Configuration ---
    window.firebaseConfig = {
        apiKey: "AIzaSyDPdSUkT56drPQGE9N4KvjM3ZoQaeamdao",
        authDomain: "lavawhey.firebaseapp.com",
        databaseURL: "https://lavawhey-default-rtdb.firebaseio.com",
        projectId: "lavawhey",
        storageBucket: "lavawhey.firebasestorage.app",
        messagingSenderId: "261576736130",
        appId: "1:261576736130:web:9d8b878a50e01c9591a39b",
        measurementId: "G-BR9VJHPJGL"
    };

    // --- State ---
    let auth, database, googleProvider;

    // --- Modal HTML ---
    const modalsHtml = `
    <!-- Login Modal -->
    <div class="modal" id="loginModal">
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <div class="modal-header">
                <h2>Đăng nhập</h2>
            </div>
            <div class="modal-body">
                <form id="loginForm">
                    <div class="form-group">
                        <label for="loginEmail">Email</label>
                        <input type="email" id="loginEmail" required>
                    </div>
                    <div class="form-group">
                        <label for="loginPassword">Mật khẩu</label>
                        <input type="password" id="loginPassword" required>
                    </div>
                    <div class="form-options">
                        <label>
                            <input type="checkbox"> Ghi nhớ đăng nhập
                        </label>
                        <a href="#" class="forgot-password">Quên mật khẩu?</a>
                    </div>
                    <button type="submit" class="submit-button">Đăng nhập</button>
                    <div class="social-login">
                        <p>Hoặc đăng nhập với</p>
                        <button type="button" class="google-login">
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google">
                            Tiếp tục với Google
                        </button>
                    </div>
                </form>
                <div class="modal-footer">
                    <p>Chưa có tài khoản? <a href="#" class="switch-modal" data-target="registerModal">Đăng ký ngay</a></p>
                    <p style="margin-top: 10px;">Trở thành nhân viên giao hàng? <a href="register-shipper.html" style="color: #FF6B00; font-weight: bold; text-decoration: none;">Đăng ký ngay</a></p>
                </div>
            </div>
        </div>
    </div>

    <!-- Register Modal -->
    <div class="modal" id="registerModal">
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <div class="modal-header">
                <h2>Đăng ký tài khoản</h2>
            </div>
            <div class="modal-body">
                <form id="registerForm">
                    <div class="form-group">
                        <label for="registerName">Họ và tên</label>
                        <input type="text" id="registerName" required>
                    </div>
                    <div class="form-group">
                        <label for="registerEmail">Email</label>
                        <input type="email" id="registerEmail" required>
                    </div>
                    <div class="form-group">
                        <label for="registerPhone">Số điện thoại</label>
                        <input type="tel" id="registerPhone" required>
                    </div>
                    <div class="form-group">
                        <label for="registerPassword">Mật khẩu</label>
                        <input type="password" id="registerPassword" required>
                    </div>
                    <div class="form-group">
                        <label for="confirmPassword">Xác nhận mật khẩu</label>
                        <input type="password" id="confirmPassword" required>
                    </div>
                    <button type="submit" class="submit-button">Đăng ký</button>
                </form>
                <div class="modal-footer">
                    <p>Đã có tài khoản? <a href="#" class="switch-modal" data-target="loginModal">Đăng nhập</a></p>
                </div>
            </div>
        </div>
    </div>

    <!-- Forgot Password Modal -->
    <div class="modal" id="forgotPasswordModal">
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <div class="modal-header">
                <h2>Quên mật khẩu</h2>
            </div>
            <div class="modal-body">
                <form id="forgotPasswordForm">
                    <div class="form-group">
                        <label for="forgotEmail">Email</label>
                        <input type="email" id="forgotEmail" required>
                    </div>
                    <button type="submit" class="submit-button">Gửi link đặt lại mật khẩu</button>
                </form>
                <div class="modal-footer">
                    <p>Đã nhớ mật khẩu? <a href="#" class="switch-modal" data-target="loginModal">Đăng nhập</a></p>
                </div>
            </div>
        </div>
    </div>
    `;

    // --- Init Function ---
    function init() {
        // Initialize Firebase if not already initialized
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        auth = firebase.auth();
        database = firebase.database();
        window.auth = auth;
        window.database = database;
        googleProvider = new firebase.auth.GoogleAuthProvider();
        googleProvider.setCustomParameters({ prompt: 'select_account' });

        // Inject modals if they don't exist
        if (!document.getElementById('loginModal')) {
            const modalContainer = document.createElement('div');
            modalContainer.id = 'auth-modals-wrapper';
            modalContainer.innerHTML = modalsHtml;
            document.body.appendChild(modalContainer);
        }

        setupEventListeners();
        checkAuthState();
    }

    function setupEventListeners() {
        const loginButton = document.querySelector('.btn-login');
        if (loginButton) {
            loginButton.addEventListener('click', function (e) {
                if (this.getAttribute('href') === '#') {
                    e.preventDefault();
                    showModal(document.getElementById('loginModal'));
                }
            });
        }

        // Close modal buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => hideModal(btn.closest('.modal')));
        });

        // Switch modal links
        document.querySelectorAll('.switch-modal').forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                hideModal(this.closest('.modal'));
                showModal(document.getElementById(this.getAttribute('data-target')));
            });
        });

        // Forgot password link
        const forgotLink = document.querySelector('.forgot-password');
        if (forgotLink) {
            forgotLink.addEventListener('click', function (e) {
                e.preventDefault();
                hideModal(document.getElementById('loginModal'));
                showModal(document.getElementById('forgotPasswordModal'));
            });
        }

        // Close on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) hideModal(e.target);
        });

        // Form submissions
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;
                showLoading('Đang đăng nhập...');
                try {
                    if (email.toLowerCase() === 'quantrilavawhey@gmail.com') {
                        // Tránh làm ghi đè LocalStorage của người dùng thường nếu admin cố gắng đăng nhập
                        window.location.href = 'admin.html';
                        return;
                    }

                    const cred = await auth.signInWithEmailAndPassword(email, password);
                    hideModal(document.getElementById('loginModal'));
                    showSuccess('Đăng nhập thành công!');
                } catch (err) {
                    showError('Đăng nhập thất bại: ' + err.message);
                }
            });
        }

        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('registerName').value;
                const email = document.getElementById('registerEmail').value;
                const password = document.getElementById('registerPassword').value;
                const confirm = document.getElementById('confirmPassword').value;

                if (password !== confirm) return showError('Mật khẩu không khớp!');

                showLoading('Đang đăng ký...');
                try {
                    const cred = await auth.createUserWithEmailAndPassword(email, password);
                    await cred.user.updateProfile({ displayName: name });
                    hideModal(document.getElementById('registerModal'));
                    showSuccess('Đăng ký thành công!');
                } catch (err) {
                    showError('Đăng ký thất bại: ' + err.message);
                }
            });
        }

        const googleBtns = document.querySelectorAll('.google-login');
        googleBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
                showLoading('Đang chuyển hướng đến Google...');
                try {
                    const res = await auth.signInWithPopup(googleProvider);
                    if (res.user) {
                        if (res.user.email === 'quantrilavawhey@gmail.com') {
                            // Tránh chia sẻ phiên bản đăng nhập quản trị với người dùng thường
                            await auth.signOut();
                            window.location.href = 'admin.html';
                            return;
                        }
                        await database.ref('users/' + res.user.uid).update({
                            displayName: res.user.displayName,
                            email: res.user.email,
                            photoURL: res.user.photoURL,
                            lastLogin: new Date().toISOString(),
                            provider: 'google'
                        });
                        hideModal(document.getElementById('loginModal'));
                        showSuccess('Đăng nhập thành công!');
                    }
                } catch (err) {
                    // User closed the popup - this is normal behavior, not an error
                    if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
                        Swal.close();
                        return;
                    }
                    console.error('Lỗi Google login:', err);
                    showError('Đăng nhập Google thất bại: ' + (err.message || ''));
                }
            });
        });

        const forgotForm = document.getElementById('forgotPasswordForm');
        if (forgotForm) {
            forgotForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('forgotEmail').value;
                showLoading('Đang gửi email...');
                try {
                    await auth.sendPasswordResetEmail(email);
                    hideModal(document.getElementById('forgotPasswordModal'));
                    showSuccess('Email đặt lại mật khẩu đã được gửi!');
                } catch (err) {
                    showError('Lỗi: ' + err.message);
                }
            });
        }
    }

    function checkAuthState() {
        auth.onAuthStateChanged(user => {
            updateUI(user);
        });
    }

    function updateUI(user) {
        const loginBtn = document.querySelector('.btn-login');
        if (!loginBtn) return;

        if (user) {
            loginBtn.innerHTML = '';
            loginBtn.removeAttribute('href');
            loginBtn.style.display = 'flex';
            loginBtn.style.alignItems = 'center';
            loginBtn.style.gap = '10px';

            if (user.email === 'quantrilavawhey@gmail.com') {
                // Admin Button - Pill shape with icon circle on right
                loginBtn.style.padding = '4px 4px 4px 20px';
                loginBtn.style.borderRadius = '50px';
                loginBtn.style.background = 'rgba(255, 107, 0, 0.1)';
                loginBtn.style.border = '2px solid #FF6B00';
                loginBtn.style.transition = 'all 0.3s ease';
                loginBtn.style.boxShadow = '0 0 15px rgba(255, 107, 0, 0.15)';
                loginBtn.title = 'Quản trị viên - Nhấp để mở menu';

                loginBtn.innerHTML = `
                    <span style="font-weight: 800; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; color: #FF6B00;">QUẢN TRỊ</span>
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #FF6B00 0%, #FF8533 100%); display: flex; align-items: center; justify-content: center; margin-left: 15px; box-shadow: 0 4px 10px rgba(255, 107, 0, 0.3);">
                        <i class="fas fa-user-shield" style="color: white; font-size: 1.2rem;"></i>
                    </div>
                `;

                // Add hover effect
                loginBtn.onmouseenter = () => {
                    loginBtn.style.background = 'rgba(255, 107, 0, 0.2)';
                    loginBtn.style.transform = 'translateY(-2px)';
                    loginBtn.style.boxShadow = '0 5px 20px rgba(255, 107, 0, 0.25)';
                };
                loginBtn.onmouseleave = () => {
                    loginBtn.style.background = 'rgba(255, 107, 0, 0.1)';
                    loginBtn.style.transform = 'translateY(0)';
                    loginBtn.style.boxShadow = '0 0 15px rgba(255, 107, 0, 0.15)';
                };

                loginBtn.onclick = (e) => {
                    e.preventDefault();
                    Swal.fire({
                        title: 'Tài khoản Quản trị',
                        text: 'Bạn muốn thực hiện hành động nào?',
                        icon: 'info',
                        showCancelButton: true,
                        confirmButtonText: '<i class="fas fa-cog"></i> Tới Dashboard',
                        cancelButtonText: '<i class="fas fa-sign-out-alt"></i> Đăng xuất',
                        confirmButtonColor: '#FF6B00',
                        cancelButtonColor: '#d33',
                        background: '#fff',
                        customClass: {
                            confirmButton: 'btn-swal-nav',
                            cancelButton: 'btn-swal-logout'
                        }
                    }).then(res => {
                        if (res.isConfirmed) {
                            window.location.href = 'admin.html';
                        } else if (res.dismiss === Swal.DismissReason.cancel) {
                            auth.signOut().then(() => showSuccess('Đã đăng xuất!'));
                        }
                    });
                };
            } else {
                // Member Button
                const avatar = user.photoURL || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
                loginBtn.style.padding = '5px 15px 5px 5px';
                loginBtn.style.borderRadius = '25px';
                loginBtn.style.background = 'rgba(255, 255, 255, 0.1)';
                loginBtn.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                loginBtn.style.color = 'white';
                loginBtn.innerHTML = `
                    <img src="${avatar}" style="width: 32px; height: 32px; border-radius: 50%; border: 2px solid white;">
                    <span style="font-weight: 500;">${user.displayName || 'Thành viên'}</span>
                `;

                loginBtn.onclick = (e) => {
                    e.preventDefault();
                    Swal.fire({
                        title: 'Tài khoản',
                        text: `Chào mừng ${user.displayName || 'Thành viên'}!`,
                        icon: 'success',
                        showCancelButton: true,
                        confirmButtonText: '<i class="fas fa-user"></i> Trang cá nhân',
                        cancelButtonText: '<i class="fas fa-sign-out-alt"></i> Đăng xuất',
                        confirmButtonColor: '#FF6B00',
                        cancelButtonColor: '#d33'
                    }).then(res => {
                        if (res.isConfirmed) {
                            window.location.href = 'member.html';
                        } else if (res.dismiss === Swal.DismissReason.cancel) {
                            auth.signOut().then(() => showSuccess('Đã đăng xuất!'));
                        }
                    });
                };
            }

            // Event listeners are set within specific blocks above
        } else {
            loginBtn.innerHTML = 'Đăng nhập';
            loginBtn.href = '#';
            loginBtn.style.cssText = ''; // Reset inline styles
            loginBtn.style.color = 'white'; // Force white text color for consistency
            loginBtn.onclick = (e) => {
                e.preventDefault();
                showModal(document.getElementById('loginModal'));
            };
        }
    }

    function confirmLogout() {
        Swal.fire({
            title: 'Đăng xuất?',
            text: 'Bạn có muốn đăng xuất khỏi hệ thống?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#FF6B00',
            confirmButtonText: 'Đăng xuất'
        }).then(res => {
            if (res.isConfirmed) {
                auth.signOut().then(() => showSuccess('Đã đăng xuất!'));
            }
        });
    }

    // Helper: Modals
    function showModal(m) {
        if (!m) return;
        m.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    function hideModal(m) {
        if (!m) return;
        m.classList.remove('show');
        document.body.style.overflow = '';
    }

    // Helper: Alerts
    function showSuccess(msg) { Swal.fire({ icon: 'success', title: msg, timer: 2000, showConfirmButton: false }); }
    function showError(msg) { Swal.fire({ icon: 'error', title: 'Lỗi', text: msg }); }
    function showLoading(msg) { Swal.fire({ title: msg, allowOutsideClick: false, didOpen: () => Swal.showLoading() }); }

    // Start on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
