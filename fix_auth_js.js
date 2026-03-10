const fs = require('fs');
const files = ['index.html', 'member.html', 'news.html', 'about.html', 'contact.html', 'policy.html', 'checkout.html', 'products.html'];
for (let f of files) {
    if (!fs.existsSync(f)) continue;
    let c = fs.readFileSync(f, 'utf8');
    let changed = false;
    if (!c.includes('js/auth-global.js')) {
        // Find where to inject
        if (c.includes('js/marquee.js')) {
            c = c.replace(/<script[^>]*src=[\"']js\/marquee\.js[\"'][^>]*><\/script>/, '<script src=\"js/auth-global.js\"></script>\n    $&');
            changed = true;
        } else if (c.includes('</body>')) {
            c = c.replace('</body>', '<script src=\"js/auth-global.js\"></script>\n</body>');
            changed = true;
        }
        if (changed) {
            fs.writeFileSync(f, c);
            console.log('Injected auth-global.js into', f);
        }
    }
}
