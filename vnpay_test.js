const crypto = require("crypto");

const signData = "vnp_Amount=18000000&vnp_Command=pay&vnp_CreateDate=20210809165218&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+don+hang+%3A5&vnp_OrderType=other&vnp_ReturnUrl=https%3A%2F%2Fdomain.vn%2FVnPayReturn&vnp_TmnCode=COCOSIN&vnp_TxnRef=5&vnp_Version=2.1.0";
const secretKey = "AYPGEQJVRJOGKMNJVHSAOQJNBVPRAGSA";

let hmac = crypto.createHmac("sha512", secretKey);
let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

console.log("Node hash:", signed);
