import * as crypto from 'crypto';
import * as tar from 'tar-fs';
import * as fs from 'fs';
import * as PATH from 'path';
import { Writable } from 'stream';

const algo = 'aes-256-ctr';

export function encrypt(options: {
    password?: string;
    input: string;
    output?: string | Writable;
    cipher?: {
        algo: string;
        key: Buffer | string;
        iv: Buffer | string;
    }
}) {
    return new Promise(async (resolve, reject) => {
        if (!options.password && !options.cipher) return reject(`Missing password`);
        if (!options.output) {
            const input = PATH.parse(options.input);
            options.output = PATH.join(input.dir, input.name + input.ext + '.encrypted');
        }

        try {

            let iv: Buffer, cipher: crypto.Cipher;

            if (options.cipher) {
                iv = typeof options.cipher.iv === 'string' ? Buffer.from(options.cipher.iv) : options.cipher.iv;
                cipher = crypto.createCipheriv(options.cipher.algo, options.cipher.key, options.cipher.iv);
            } else {
                iv = crypto.randomBytes(16)
                cipher = crypto.createCipheriv(algo, crypto.createHash('sha256').update(options.password).digest(), iv);
            }

            const writeStream = options.output instanceof Writable ? options.output : fs.createWriteStream(options.output as string),
                isFile = await new Promise((resolve: (isFile: boolean) => void) => {
                    fs.stat(options.input, (err, stats) => {
                        if (err) return reject(err);
                        resolve(stats.isFile());
                    });
                });

            writeStream.write(Buffer.concat([Buffer.from(isFile ? 'F' : 'D'), iv]), (err) => {
                if (err) return reject(err);
                writeStream.on('finish', resolve);
                (isFile ? fs.createReadStream : tar.pack)(options.input).on('error', reject).pipe(cipher).pipe(writeStream)
            });
        } catch (err) {
            reject(err);
        }
    });
}

export function decrypt(options: {
    password?: string;
    input: string;
    output?: string;
    cipher?: {
        algo: string;
        key: Buffer | string;
        ivLength: number;
    }
}) {
    return new Promise(async (resolve, reject) => {
        if (!options.password && !options.cipher) return reject(`Missing password`);
        if (!options.output) {
            const input = PATH.parse(options.input);
            options.output = PATH.join(input.dir, input.name);
        }

        try {
            let cipher: crypto.Decipher;

            const head = await parseHead(options.input, options.cipher ? options.cipher.ivLength : 16);

            if (options.cipher) cipher = crypto.createDecipheriv(options.cipher.algo, options.cipher.key, head.iv);
            else cipher = crypto.createDecipheriv(algo, crypto.createHash('sha256').update(options.password).digest(), head.iv);

            const readStream = fs.createReadStream(options.input, { start: options.cipher ? options.cipher.ivLength + 1 : 17 }),
                outputStream = head.isFile ? fs.createWriteStream(options.output) : tar.extract(options.output);

            outputStream.on('finish', resolve);
            readStream.pipe(cipher).pipe(outputStream).on('error', reject);
        } catch (err) {
            reject(err);
        }
    });
}

function parseHead(path: string, ivLength: number) {
    return new Promise((resolve: (head: { isFile: boolean; iv: Buffer }) => void, reject) => {
        fs.open(path, 'r', (err, fd) => {
            if (err) return reject(err);
            let buffer = Buffer.alloc(ivLength + 1);
            fs.read(fd, buffer, 0, ivLength + 1, 0, (err) => {
                if (err) return reject(err);
                const type = buffer.toString()[0];
                let head = { isFile: null, iv: buffer.slice(1) }
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