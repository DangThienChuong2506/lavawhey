/**
 * LavaWhey Real-time Notification System
 * Listens for order status updates and shows browser notifications.
 */

(function () {
    'use strict';

    // Helper: format status to Vietnamese
    const statusMap = {
        'pending': 'Đang chờ xử lý',
        'processing': 'Đang được xử lý',
        'shipping': 'Đang được giao đi',
        'delivered': 'Đã giao hàng thành công',
        'paid': 'Đã thanh toán',
        'cancel': 'Đã hủy'
    };

    function initNotifications() {
        // Ensure Firebase is initialized before using its services
        if (!firebase.apps.length) {
            if (typeof window.firebaseConfig !== 'undefined') {
                firebase.initializeApp(window.firebaseConfig);
            } else {
                // Wait for other scripts or auth-global.js to initialize
                setTimeout(initNotifications, 500);
                return;
            }
        }

        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                console.log('Notification system: User logged in, listening for updates...');

                // User notifications (Order status updates)
                listenForOrderUpdates(user.uid);

                // Admin notifications (New orders)
                if (user.email === 'quantrilavawhey@gmail.com') {
                    listenForNewOrders();
                }
            }
        });
    }

    function listenForNewOrders() {
        const ordersRef = firebase.database().ref('orders');
        // Listen for new children added since the listener started
        const startTime = Date.now();
        ordersRef.limitToLast(1).on('child_added', (snapshot) => {
            const order = snapshot.val();
            // Only notify for orders created AFTER the listener started
            if (new Date(order.createdAt).getTime() > startTime - 1000) {
                showAdminNotification(snapshot.key, order);
            }
        });
    }

    function showAdminNotification(orderId, order) {
        const customerName = `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`;

        Swal.fire({
            title: 'Hệ thống: Có đơn hàng mới!',
            text: `Khách hàng ${customerName} vừa đặt đơn #${orderId.slice(-6)}`,
            icon: 'warning',
            position: 'bottom-start',
            toast: true,
            showConfirmButton: true,
            confirmButtonText: 'Xem ngay',
            timer: 10000
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = 'admin.html';
            }
        });
    }

    function listenForOrderUpdates(userId) {
        const ordersRef = firebase.database().ref('orders');

        // Listen for changes in orders
        // Note: For a real production app, we would use Cloud Functions + FCM.
        // For this project, we use RTDB listeners to simulate real-time notification.
        ordersRef.orderByChild('userId').equalTo(userId).on('child_changed', (snapshot) => {
            const updatedOrder = snapshot.val();
            const orderId = snapshot.key;

            showOrderNotification(orderId, updatedOrder.status);
        });
    }

    function showOrderNotification(orderId, status) {
        const statusText = statusMap[status] || status;

        // Create custom toast notification below fixed header
        const toast = document.createElement('div');
        toast.className = 'custom-toast-notification';
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-bell"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">Cập nhật đơn hàng #${orderId.slice(-6)}</div>
                <div class="toast-text">Trạng thái: ${statusText}</div>
            </div>
            <button class="toast-close">&times;</button>
        `;

        // Remove existing toast if any
        const existingToast = document.querySelector('.custom-toast-notification');
        if (existingToast) {
            existingToast.remove();
        }

        document.body.appendChild(toast);

        // Trigger animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Add close button functionality
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });

        // Auto hide after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);

        // Also try browser notification if permission granted
        if (Notification.permission === "granted") {
            new Notification("LavaWhey - Cập nhật đơn hàng", {
                body: `Đơn hàng #${orderId.slice(-6)} của bạn ${statusText.toLowerCase()}.`,
                icon: 'https://lavawhey.firebaseapp.com/favicon.ico'
            });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission();
        }
    }

    // Initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNotifications);
    } else {
        initNotifications();
    }

})();
