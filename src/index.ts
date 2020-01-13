import * as crypto from 'crypto';
import * as tar from 'tar-fs';
import * as fs from 'fs';
import * as PATH from 'path';
import { Writable } from 'stream';

const algo = 'aes-256-ctr';

export function encrypt(options: { password: string; input: string; output?: string | Writable }) {
    return new Promise(async (resolve, reject) => {
        if (!options.output) {
            const input = PATH.parse(options.input);
            options.output = PATH.join(input.dir, input.name + input.ext + '.encrypted');
        }

        try {
            const iv = crypto.randomBytes(16),
                cipher = crypto.createCipheriv(algo, crypto.createHash('sha256').update(options.password).digest(), iv),
                writeStream = options.output instanceof Writable ? options.output : fs.createWriteStream(options.output as string),
                isFile = await new Promise((resolve: (isFile: boolean) => void) => {
                    fs.stat(options.input, (err, stats) => {
                        if (err) return reject(err);
                        resolve(stats.isFile());
                    });
                });

            writeStream.write(Buffer.concat([Buffer.from(isFile ? 'F' : 'D'), iv]), (err) => {
                if (err) return reject(err);
                writeStream.on('finish', resolve);
                (isFile ? fs.createReadStream : tar.pack)(options.input).pipe(cipher).pipe(writeStream).on('error', reject);;
            });
        } catch (err) {
            reject(err);
        }
    });
}

export function decrypt(options: { password: string; input: string; output?: string }) {
    return new Promise(async (resolve, reject) => {
        if (!options.output) {
            const input = PATH.parse(options.input);
            options.output = PATH.join(input.dir, input.name);
        }

        try {
            const head = await parseHead(options.input),
                cipher = crypto.createDecipheriv(algo, crypto.createHash('sha256').update(options.password).digest(), head.iv),
                readStream = fs.createReadStream(options.input, { start: 17 }),
                outputStream = head.isFile ? fs.createWriteStream(options.output) : tar.extract(options.output);

            outputStream.on('finish', resolve);
            readStream.pipe(cipher).pipe(outputStream).on('error', reject);
        } catch (err) {
            reject(err);
        }
    });
}

function parseHead(path: string) {
    return new Promise((resolve: (head: { isFile: boolean; iv: Buffer }) => void, reject) => {
        fs.open(path, 'r', (err, fd) => {
            if (err) return reject(err);
            let buffer = Buffer.alloc(17);
            fs.read(fd, buffer, 0, 17, 0, (err) => {
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