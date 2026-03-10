const crypto = require("crypto");
const vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const vnp_TmnCode = "CGXZLS0Z";
const vnp_HashSecret = "XNBCJFAKAZQSGTARRLGCHVZWCIOIGSHN";

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
    vnp_ReturnUrl: "http://localhost/return",
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
console.log(vnp_Url + '?' + signData + '&vnp_SecureHash=' + signed);
