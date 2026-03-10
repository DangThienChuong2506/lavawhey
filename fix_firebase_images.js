const https = require('https');

const dbUrl = 'https://lavawhey-default-rtdb.firebaseio.com/categories.json';

// Fetch current data
https.get(dbUrl, (res) => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', () => {
        let categories = JSON.parse(raw);
        let promises = [];

        categories.forEach((cat, cIdx) => {
            if (cat.products) {
                cat.products.forEach((prod, pIdx) => {
                    if (prod.image && prod.image.includes('th.bing.com')) {
                        // Create promise to check if image is 404
                        const p = new Promise((resolve) => {
                            https.get(prod.image, (imgRes) => {
                                if (imgRes.statusCode === 404) {
                                    console.log(`Replacing broken image for ${prod.name}`);
                                    prod.image = 'https://suckhoehangngay.mediacdn.vn/thumb_w/600/154880486097817600/2020/8/10/20190829063758523105whey-protein-la-gimax-800x800-15970551551471580098420-0-25-468-774-crop-1597055170642656384816.png';
                                    resolve(true);
                                } else {
                                    resolve(false);
                                }
                            }).on('error', () => {
                                prod.image = 'https://suckhoehangngay.mediacdn.vn/thumb_w/600/154880486097817600/2020/8/10/20190829063758523105whey-protein-la-gimax-800x800-15970551551471580098420-0-25-468-774-crop-1597055170642656384816.png';
                                resolve(true);
                            });
                        });
                        promises.push(p);
                    }
                });
            }
        });

        Promise.all(promises).then((results) => {
            const hasChanges = results.some(r => r);
            if (hasChanges) {
                // UPDATE FIREBASE
                const req = https.request({
                    hostname: 'lavawhey-default-rtdb.firebaseio.com',
                    path: '/categories.json',
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' }
                }, (putRes) => {
                    console.log('Firebase updated, status:', putRes.statusCode);
                });
                req.write(JSON.stringify(categories));
                req.end();
            } else {
                console.log('No broken images found.');
            }
        });
    });
});
