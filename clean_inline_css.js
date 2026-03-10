const fs = require('fs');

const files = ['index.html', 'member.html', 'news.html', 'about.html', 'contact.html', 'policy.html', 'checkout.html', 'products.html'];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // For all HTML files, remove the inline navbar CSS.
    // We'll search for '    /* Header & Navigation */' and delete to the next section or the end of the <style> block
    const headerCSSRegex1 = /\/\*\s*Header & Navigation\s*\*\/[\s\S]*?(?=\/\*\s*(Hero Section|Featured Products|Products Page Specific Styles|About Us Section|Contact Layout|Policy|Dashboard Layout|News|Checkout|Products|Footer|Hero|Top Banner))/g;

    if (headerCSSRegex1.test(content)) {
        content = content.replace(headerCSSRegex1, '');
        changed = true;
    }

    // Also we want to ensure body has padding-top: 155px if it's not inline. Actually it's best to put it in header.css
    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('✅ Cleaned inline CSS in:', file);
    }
}
