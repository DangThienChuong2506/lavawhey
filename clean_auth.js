const fs = require('fs');

function cleanFile(filename, startStr, endStr) {
    if (!fs.existsSync(filename)) return;
    const lines = fs.readFileSync(filename, 'utf8').split('\n');
    const startIdx = lines.findIndex(l => l.includes(startStr));
    const endIdx = lines.findIndex((l, idx) => idx > startIdx && l.includes(endStr));

    if (startIdx !== -1 && endIdx !== -1) {
        lines.splice(startIdx, endIdx - startIdx);
        fs.writeFileSync(filename, lines.join('\n'));
        console.log('Cleaned', filename, 'from line', startIdx, 'to', endIdx);
    } else {
        console.log('Could not find boundaries in', filename, startIdx, endIdx);
    }
}

cleanFile('products.html', '// Modal Functionality', '// Xử lý tham số URL và lọc sản phẩm');
cleanFile('index.html', '// Modal Functionality', '// Scroll Effect');
