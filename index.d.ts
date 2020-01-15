/// <reference types="node" />
import { Writable } from 'stream';
export declare function encrypt(options: {
    password?: string;
    input: string;
    output?: string | Writable;
    cipher?: {
        algo: string;
        key: Buffer | string;
        iv: Buffer | string;
    };
}): Promise<unknown>;
export declare function decrypt(options: {
    password?: string;
    input: string;
    output?: string;
    cipher?: {
        algo: string;
        key: Buffer | string;
        ivLength: number;
    };
}): Promise<unknown>;
