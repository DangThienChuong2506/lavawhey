const crypto = require("crypto");
const https = require('https');
const vnp_TmnCode = "CHAIVN01";
const vnp_HashSecret = "GMHSLNMDURNWMCRVYLUWLJIOPVRYMMVL";

const vnp_Params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: vnp_TmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: "123456",
    vnp_OrderInfo: "Test",
    vnp_OrderType: 'other',
    vnp_Amount: 10000000,
    vnp_ReturnUrl: "file:///C:/DoAn2/WebLavaWhey/vnpay_return.html",
    vnp_IpAddr: "127.0.0.1",
    vnp_CreateDate: "20240304120000"
};

let signDataArr = [];
let sortedKeys = Object.keys(vnp_Params).sort();
for (let key of sortedKeys) {
    signDataArr.push(encodeURIComponent(key) + '=' + encodeURIComponent(vnp_Params[key]).replace(/%20/g, "+"));
}
const signData = signDataArr.join('&');
let hmac = crypto.createHmac("sha512", vnp_HashSecret);
let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
const path = '/paymentv2/vpcpay.html?' + signData + '&vnp_SecureHash=' + signed;

const options = {
    hostname: 'sandbox.vnpayment.vn',
    port: 443,
    path: path,
    method: 'GET',
    headers: {
        'User-Agent': 'Mozilla/5.0'
    }
};

const req = https.request(options, res => {
    if (res.statusCode === 302) {
        console.log("302 -> " + res.headers.location);
    } else {
        console.log("Status -> " + res.statusCode);
    }
});
req.end();
