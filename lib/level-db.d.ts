import { LevelUp } from 'levelup';
import { BatchOptions, SearchOptions } from 'tiny-host-common';
export declare class LevelDB {
    private _db;
    getUserFromUsername: (username: string) => Promise<{
        id?: string;
    }>;
    private scope;
    get db(): LevelUp;
    safeGet(key: string): Promise<any>;
    constructor(_db: LevelUp, getUserFromUsername: (username: string) => Promise<{
        id?: string;
    }>, scope?: string);
    get(user: string, scope: string, key: string): Promise<any>;
    add(user: string, scope: string, value: any): Promise<string>;
    put(user: string, scope: string, key: string, value: any): Promise<void>;
    del(user: string, scope: string, key: string): Promise<void>;
    delAllUserData(user: string): Promise<void>;
    search(user: string, scope: string, options: SearchOptions): Promise<any[]>;
    batch(user: string, scope: string, batch: BatchOptions): Promise<void>;
}
