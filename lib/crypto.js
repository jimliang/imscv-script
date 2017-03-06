/**
 * Created by jimliang on 2017/2/20.
 */
var CryptoJS = require("crypto-js");

const key = CryptoJS.enc.Latin1.parse('EJKD93LJK8923ACD'),
    iv = CryptoJS.enc.Latin1.parse('23KCSLED43DFJKDE')

function encrypt(data) {
    var encrypted = CryptoJS.AES.encrypt(data, key, {iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.ZeroPadding})
    return encrypted.ciphertext.toString(CryptoJS.enc.Base64)
}

function decrypt(data) {
    var encrypted = CryptoJS.AES.decrypt(data, key, {iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.ZeroPadding})
    return encrypted.toString(CryptoJS.enc.Utf8)

}

module.exports = {encrypt, decrypt}