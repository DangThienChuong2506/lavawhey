const fs = require('fs');

const requiredTags = [
    '<script src="js/auth-global.js"></script>',
    '<script src="js/marquee.js" charset="UTF-8"></script>',
    '<link rel="stylesheet" href="modals.css">',
    '<link rel="stylesheet" href="header.css">'
].join('\n    ');

const files = ['index.html', 'member.html', 'news.html', 'about.html', 'contact.html', 'policy.html', 'checkout.html'];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Insert links right before </head> to ensure they override earlier inline <style>
    if (!content.includes('header.css')) {
        content = content.replace('</head>', `    ${requiredTags}\n</head>`);
        changed = true;
    }

    // For index.html, we MUST remove the inline navbar CSS because it has !important or highly specific rules that clash 
    // Let's remove the inline header CSS starting from /* Header & Navigation */ down to /* Hero Section */
    const headerCSSRegex = /\/\*\s*Header & Navigation\s*\*\/[\s\S]*?(?=\/\*\s*(Hero Section|Featured Products|Products Page Specific Styles|About Us Section|Contact Layout|Policy|Dashboard Layout|News|Checkout))/g;

    if (headerCSSRegex.test(content)) {
        content = content.replace(headerCSSRegex, '');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('✅ Fixed head tags & cleaned inline CSS in:', file);
    }
}
