/* Dig In — shared site navigation behavior (hamburger, dropdowns, active link, coin sync) */
(function () {
    function currentPage() {
        const path = window.location.pathname;
        const file = path.substring(path.lastIndexOf('/') + 1);
        return file || 'index.html';
    }

    function markActiveLinks() {
        const page = currentPage();
        document.querySelectorAll('.nav-links a[href]').forEach(function (link) {
            const href = link.getAttribute('href').split('/').pop();
            if (href === page) {
                link.classList.add('active');
                const dropdown = link.closest('.nav-dropdown');
                if (dropdown) {
                    const btn = dropdown.querySelector('.nav-drop-btn');
                    if (btn) btn.classList.add('active');
                }
            }
        });
    }

    function setupDropdowns() {
        const dropdowns = document.querySelectorAll('.nav-dropdown');
        dropdowns.forEach(function (dropdown) {
            const btn = dropdown.querySelector('.nav-drop-btn');
            if (!btn) return;
            btn.setAttribute('aria-expanded', 'false');
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const isOpen = dropdown.classList.contains('open');
                dropdowns.forEach(function (d) {
                    d.classList.remove('open');
                    const b = d.querySelector('.nav-drop-btn');
                    if (b) b.setAttribute('aria-expanded', 'false');
                });
                if (!isOpen) {
                    dropdown.classList.add('open');
                    btn.setAttribute('aria-expanded', 'true');
                }
            });
        });

        document.addEventListener('click', function () {
            dropdowns.forEach(function (d) { d.classList.remove('open'); });
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                dropdowns.forEach(function (d) { d.classList.remove('open'); });
            }
        });
    }

    function setupHamburger() {
        const hamburger = document.getElementById('navHamburger');
        const navLinks = document.getElementById('navLinks');
        if (!hamburger || !navLinks) return;

        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.addEventListener('click', function (e) {
            e.stopPropagation();
            const isOpen = navLinks.classList.toggle('open');
            hamburger.classList.toggle('open', isOpen);
            hamburger.setAttribute('aria-expanded', String(isOpen));
        });

        // Closing the mobile panel when a real link is tapped (not a dropdown toggle button)
        navLinks.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                navLinks.classList.remove('open');
                hamburger.classList.remove('open');
                hamburger.setAttribute('aria-expanded', 'false');
            });
        });
    }

    function syncCoinCounter() {
        const coinEl = document.getElementById('coinCount');
        if (!coinEl) return;
        const stored = parseInt(localStorage.getItem('dig_in_coins') || '0', 10);
        coinEl.textContent = stored;
    }

    function init() {
        markActiveLinks();
        setupDropdowns();
        setupHamburger();
        syncCoinCounter();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
