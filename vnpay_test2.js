const crypto = require("crypto");
const CryptoJS = require("crypto-js");

const secretKey = "AYPGEQJVRJOGKMNJVHSAOQJNBVPRAGSA";

// A mock vnp_Params like what the client generates
const vnp_Params = {
    vnp_Amount: 12000000,
    vnp_Command: "pay",
    vnp_CreateDate: "20230222165218",
    vnp_CurrCode: "VND",
    vnp_IpAddr: "192.168.1.1",
    vnp_Locale: "vn",
    vnp_OrderInfo: "Thanh toan don hang 123",
    vnp_OrderType: "other",
    vnp_ReturnUrl: "http://localhost:5500/vnpay_return.html",
    vnp_TmnCode: "2QXUI4J4",
    vnp_TxnRef: "123",
    vnp_Version: "2.1.0"
};

let signDataArr = [];
let sortedKeys = Object.keys(vnp_Params).sort();
for (let i = 0; i < sortedKeys.length; i++) {
    let key = sortedKeys[i];
    let value = vnp_Params[key];
    if (value !== undefined && value !== null && value !== '') {
        signDataArr.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(value)).replace(/%20/g, "+"));
    }
}
const signData = signDataArr.join('&');

let hmac = crypto.createHmac("sha512", secretKey);
let signedNode = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

const hmacCryptoJs = CryptoJS.HmacSHA512(signData, secretKey);
let signedCryptoJs = hmacCryptoJs.toString(CryptoJS.enc.Hex);

console.log("Node:", signedNode);
console.log("CryptoJS:", signedCryptoJs);
