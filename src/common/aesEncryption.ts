const crypto = require("crypto");
const encryptionType = "aes-256-ctr";
const encryptionEncoding = "base64";
const bufferEncryption = "utf-8";
const secret = "$kYc|iniC@2o2!";
const AesIV = "ABCDEFGHIJKLMNOP";

class AesEncryption {
  encrypt(jsonObj: String): any {
    return jsonObj;
    if (jsonObj) {
      const value = jsonObj;
      const key = crypto
        .createHash("sha256")
        .update(String(secret))
        .digest("base64")
        .substr(0, 32);
      const iv = Buffer.from(AesIV, bufferEncryption);
      const cipher = crypto.createCipheriv(encryptionType, key, iv);
      let encrypted = cipher.update(
        value,
        bufferEncryption,
        encryptionEncoding
      );
      encrypted += cipher.final(encryptionEncoding);
      return encrypted;
    } else {
      return "";
    }
  }

  decrypt(base64String: String) {
    return base64String;
    if (base64String) {
      const buff = Buffer.from(base64String, encryptionEncoding);
      const key = crypto
        .createHash("sha256")
        .update(String(secret))
        .digest("base64")
        .substr(0, 32);
      const iv = Buffer.from(AesIV, bufferEncryption);
      const decipher = crypto.createDecipheriv(encryptionType, key, iv);
      const deciphered = decipher.update(buff) + decipher.final();
      return deciphered;
    } else {
      return "";
    }
  }
}

export default new AesEncryption();
