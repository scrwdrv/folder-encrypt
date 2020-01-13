/// <reference types="node" />
import { Writable } from 'stream';
export declare function encrypt(options: {
    password: string;
    input: string;
    output?: string | Writable;
}): Promise<unknown>;
export declare function decrypt(options: {
    password: string;
    input: string;
    output?: string;
}): Promise<unknown>;
