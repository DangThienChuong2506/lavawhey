const fs = require('fs');
function extractNav(f) {
    const c = fs.readFileSync(f, 'utf8');
    const match = c.match(/<nav class="navbar">([\s\S]*?)<\/nav>/);
    if (match) return match[0];
    return 'not found';
}
const mNav = extractNav('member.html');
const iNav = extractNav('index.html');
const pNav = extractNav('products.html');
fs.writeFileSync('nav_member.txt', mNav);
fs.writeFileSync('nav_index.txt', iNav);
fs.writeFileSync('nav_products.txt', pNav);
console.log('Done extracting.');
