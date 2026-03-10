(function () {
    function initMarquee() {
        const marqueeInner = document.querySelector('.top-banner-marquee .marquee-inner');
        const marqueeContent = document.querySelector('.top-banner-marquee .marquee-content');

        if (!marqueeInner || !marqueeContent) return;

        let x = 0;
        let speed = 1.0; // pixels per frame
        let isDragging = false;
        let startX = 0;
        let initialX = 0;

        // Reset any CSS animation
        marqueeContent.style.animation = 'none';
        marqueeInner.style.cursor = 'grab';
        marqueeInner.style.userSelect = 'none';

        function animate() {
            if (!isDragging) {
                x -= speed;

                // Seamless loop logic
                const totalWidth = marqueeContent.scrollWidth;
                const halfWidth = totalWidth / 2;

                if (Math.abs(x) >= halfWidth) {
                    x = 0;
                }

                marqueeContent.style.transform = `translateX(${x}px)`;
            }
            requestAnimationFrame(animate);
        }

        // Mouse Events
        marqueeInner.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.pageX;
            initialX = x;
            marqueeInner.style.cursor = 'grabbing';
            e.preventDefault();
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const dx = e.pageX - startX;
            x = initialX + dx;

            // Loop while dragging
            const halfWidth = marqueeContent.scrollWidth / 2;
            if (x > 0) x -= halfWidth;
            if (x < -halfWidth) x += halfWidth;

            marqueeContent.style.transform = `translateX(${x}px)`;
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
            marqueeInner.style.cursor = 'grab';
        });

        // Touch Events
        marqueeInner.addEventListener('touchstart', (e) => {
            isDragging = true;
            startX = e.touches[0].pageX;
            initialX = x;
        });

        window.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const dx = e.touches[0].pageX - startX;
            x = initialX + dx;

            const halfWidth = marqueeContent.scrollWidth / 2;
            if (x > 0) x -= halfWidth;
            if (x < -halfWidth) x += halfWidth;

            marqueeContent.style.transform = `translateX(${x}px)`;
        });

        window.addEventListener('touchend', () => {
            isDragging = false;
        });

        // Hover effect: slow down or pause
        marqueeInner.addEventListener('mouseenter', () => {
            if (!isDragging) speed = 0.5;
        });
        marqueeInner.addEventListener('mouseleave', () => {
            if (!isDragging) speed = 1.0;
        });

        // Start animation
        animate();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMarquee);
    } else {
        initMarquee();
    }
})();
