import { encrypt,decrypt } from './index';
import * as crypto from 'crypto';

/* const t = Date.now();

encrypt({
    input: './node_modules',
    cipher: {
        algo: 'aes-256-gcm',
        key: crypto.createHash('sha256').update('123').digest(),
        iv: crypto.randomBytes(16)
    }
}).then(() => {
    console.log(Date.now() - t)
}).catch(e => {
    console.log(e)
}) 

 */
