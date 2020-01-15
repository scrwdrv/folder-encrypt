"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const crypto = require("crypto");
const t = Date.now();
index_1.encrypt({
    input: './node_modules',
    cipher: {
        algo: 'aes-256-gcm',
        key: crypto.createHash('sha256').update('123').digest(),
        iv: crypto.randomBytes(16)
    }
}).then(() => {
    console.log(Date.now() - t);
}).catch(e => {
    console.log(e);
});
