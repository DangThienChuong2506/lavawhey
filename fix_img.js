const fs = require('fs');

function fixHtml(filename) {
    if (!fs.existsSync(filename)) return;
    let text = fs.readFileSync(filename, 'utf8');

    // Inject the getSafeImage function into the main script tags
    if (!text.includes('function getSafeImage')) {
        let code = `
        function getSafeImage(url) {
            if(!url) return 'https://via.placeholder.com/200x200?text=No+Image';
            if(url.includes('th.bing.com')) return 'https://via.placeholder.com/200x200?text=Expired+Bing+Image';
            return url;
        }
        `;

        text = text.replace(/<script>/, '<script>\n' + code);

        // Replace ${product.image} with ${getSafeImage(product.image)}
        text = text.replace(/\${product\.image}/g, '${getSafeImage(product.image)}');
        text = text.replace(/\${item\.image}/g, '${getSafeImage(item.image)}');

        fs.writeFileSync(filename, text);
        console.log('Fixed safe image logic in', filename);
    }
}

fixHtml('products.html');
fixHtml('index.html');
