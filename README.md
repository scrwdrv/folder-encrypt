# folder-encrypt
 Simple module that helps you encrypt & decrypt folder/file with password.

## Installation
```sh
npm i folder-encrypt
```

## Usage
Both methods (```encrypt```, ```decrypt```) of folder-encrypt use Promise, and it will automatically detect whether this path is a file or directory.

### Folder/File Encryption
```js
import * as folderEncrypt from 'folder-encrypt';

folderEncrypt.encrypt({
    password: 'your-password',
    input: 'your-file-or-folder',
    output: 'your-file-or-folder.encrypted' // optional, default will be input path with extension `encrypted`
}).then(() => {
    console.log('encrypted!');
}).catch((err) => {
    console.log(err);
});
```
### Folder/File Decryption
```js
folderEncrypt.decrypt({
    password: 'your-password',
    input: 'your-file-or-folder.encrypted',
    output: 'your-file-or-folder' // optional, default will be input path without extension
}).then(() => {
    console.log('decrypted!');
    // when using a wrong password on file decryption, the file will be decrypted to a bunch of garbled text. 
    // But still considered `decrypted` due to there is no way knowing the original content.
}).catch((err) => {
    console.log(err); 
    // when using a wrong password on directory decryption, a `tar is corrupted` error will occured.
});
```