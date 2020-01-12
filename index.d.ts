export declare function encrypt(options: {
    password: string;
    input: string;
    output?: string;
}): Promise<unknown>;
export declare function decrypt(options: {
    password: string;
    input: string;
    output?: string;
}): Promise<unknown>;
