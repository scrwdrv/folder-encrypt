"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const tar = require("tar-fs");
const fs = require("fs");
const PATH = require("path");
const stream_1 = require("stream");
const algo = 'aes-256-ctr';
function encrypt(options) {
    return new Promise(async (resolve, reject) => {
        if (!options.password && !options.cipher)
            return reject(`Missing password`);
        if (!options.output) {
            const input = PATH.parse(options.input);
            options.output = PATH.join(input.dir, input.name + input.ext + '.encrypted');
        }
        try {
            let iv, cipher;
            if (options.cipher) {
                iv = typeof options.cipher.iv === 'string' ? Buffer.from(options.cipher.iv) : options.cipher.iv;
                cipher = crypto.createCipheriv(options.cipher.algo, options.cipher.key, options.cipher.iv);
            }
            else {
                iv = crypto.randomBytes(16);
                cipher = crypto.createCipheriv(algo, crypto.createHash('sha256').update(options.password).digest(), iv);
            }
            const writeStream = options.output instanceof stream_1.Writable ? options.output : fs.createWriteStream(options.output), isFile = await new Promise((resolve) => {
                fs.stat(options.input, (err, stats) => {
                    if (err)
                        return reject(err);
                    resolve(stats.isFile());
                });
            });
            writeStream.write(Buffer.concat([Buffer.from(isFile ? 'F' : 'D'), iv]), (err) => {
                if (err)
                    return reject(err);
                writeStream.on('finish', resolve);
                (isFile ? fs.createReadStream : tar.pack)(options.input).on('error', reject).pipe(cipher).pipe(writeStream);
            });
        }
        catch (err) {
            reject(err);
        }
    });
}
exports.encrypt = encrypt;
function decrypt(options) {
    return new Promise(async (resolve, reject) => {
        if (!options.password && !options.cipher)
            return reject(`Missing password`);
        if (!options.output) {
            const input = PATH.parse(options.input);
            options.output = PATH.join(input.dir, input.name);
        }
        try {
            let cipher;
            const head = await parseHead(options.input, options.cipher ? options.cipher.ivLength : 16);
            if (options.cipher)
                cipher = crypto.createDecipheriv(options.cipher.algo, options.cipher.key, head.iv);
            else
                cipher = crypto.createDecipheriv(algo, crypto.createHash('sha256').update(options.password).digest(), head.iv);
            const readStream = fs.createReadStream(options.input, { start: options.cipher ? options.cipher.ivLength + 1 : 17 }), outputStream = head.isFile ? fs.createWriteStream(options.output) : tar.extract(options.output);
            outputStream.on('finish', resolve);
            readStream.pipe(cipher).pipe(outputStream).on('error', reject);
        }
        catch (err) {
            reject(err);
        }
    });
}
exports.decrypt = decrypt;
function parseHead(path, ivLength) {
    return new Promise((resolve, reject) => {
        fs.open(path, 'r', (err, fd) => {
            if (err)
                return reject(err);
            let buffer = Buffer.alloc(ivLength + 1);
            fs.read(fd, buffer, 0, ivLength + 1, 0, (err) => {
                if (err)
                    return reject(err);
                const type = buffer.toString()[0];
                let head = { isFile: null, iv: buffer.slice(1) };
                switch (type) {
                    case 'D':
                        head.isFile = false;
                        break;
                    case 'F':
                        head.isFile = true;
                        break;
                    default:
                        return reject(`Unknown type: ${type}`);
                }
                resolve(head);
            });
        });
    });
}
