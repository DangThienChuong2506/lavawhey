const https = require('https');
const options = {
    hostname: 'sandbox.vnpayment.vn',
    port: 443,
    path: '/paymentv2/vpcpay.html?vnp_Amount=10000000&vnp_Command=pay&vnp_CreateDate=20240304120000&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+don+hang+123456&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%2Freturn&vnp_TmnCode=2QXUI4J4&vnp_TxnRef=123456&vnp_Version=2.1.0&vnp_SecureHash=WRONGHASH123456',
    method: 'GET',
    headers: {
        'User-Agent': 'Mozilla/5.0'
    }
};

const req = https.request(options, res => {
    let rawData = '';
    res.on('data', d => { rawData += d; });
    res.on('end', () => {
        console.log("Status: " + res.statusCode);
        if (res.statusCode === 302) {
            console.log("Location:", res.headers.location);
        }
    });
});
req.end();
