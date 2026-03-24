const fs = require('fs');
const path = require('path');

const htmlDir = path.join(__dirname, '..', 'html');
const files = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html'));

for (const file of files) {
    const filePath = path.join(htmlDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Fix CSS files
    content = content.replace(/href="(?!\.\.\/|http[s]?:\/\/|\/\/)(?:css\/)?([^"]+\.css)"/g, 'href="../css/$1"');

    // Fix JS files
    content = content.replace(/src="(?!\.\.\/|http[s]?:\/\/|\/\/)(?:js\/)?([^"]+\.js)"/g, 'src="../js/$1"');

    // Fix images in src="images/..."
    content = content.replace(/src="(?!\.\.\/|http[s]?:\/\/|\/\/)images\//g, 'src="../images/');

    // Fix images in href="images/..."
    content = content.replace(/href="(?!\.\.\/|http[s]?:\/\/|\/\/)images\//g, 'href="../images/');

    // Fix inline styling containing background-image
    content = content.replace(/url\(['"]?(?!\.\.\/|http[s]?:\/\/|\/\/)images\//g, 'url(\'../images/');

    // Fix json like href="manifest.json" ?
    content = content.replace(/href="(?!\.\.\/|http[s]?:\/\/|\/\/)(?:json\/)?([^"]+\.json)"/g, 'href="../json/$1"');

    fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Update HTML links successfully!');
