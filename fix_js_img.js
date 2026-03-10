const fs = require('fs');

function injectImageSafeLogic(filename) {
    if (!fs.existsSync(filename)) return;
    let text = fs.readFileSync(filename, 'utf8');

    // Inject the getSafeImage if not present
    let changed = false;
    if (!text.includes('function getSafeImage')) {
        let code = `
// Add safe image checker 
function getSafeImage(url) {
    if(!url) return 'https://via.placeholder.com/200x200?text=No+Image';
    if(url.includes('th.bing.com')) return 'https://suckhoehangngay.mediacdn.vn/thumb_w/600/154880486097817600/2020/8/10/20190829063758523105whey-protein-la-gimax-800x800-15970551551471580098420-0-25-468-774-crop-1597055170642656384816.png';
    return url;
}
`;
        text = code + '\n' + text;
        changed = true;
    }

    // Replace the template bindings
    if (text.includes('${sp.image}')) {
        text = text.replace(/\$\{sp\.image\}/g, '${getSafeImage(sp.image)}');
        changed = true;
    }
    if (text.includes('${product.image}')) {
        text = text.replace(/\$\{product\.image\}/g, '${getSafeImage(product.image)}');
        changed = true;
    }
    if (text.includes('${item.image}')) {
        text = text.replace(/\$\{item\.image\}/g, '${getSafeImage(item.image)}');
        changed = true;
    }
    if (changed) {
        fs.writeFileSync(filename, text);
        console.log('Fixed safe image logic in', filename);
    }
}

injectImageSafeLogic('search_new.js');
injectImageSafeLogic('js/auth-global.js');
injectImageSafeLogic('filter_products.js');
