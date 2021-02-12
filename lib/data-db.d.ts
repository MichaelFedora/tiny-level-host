import { LevelUp } from 'levelup';
import { BatchOptions, SearchOptions } from './types';
export declare class DataDB {
    private _db;
    getUserFromUsername: (username: string) => Promise<{
        id?: string;
    }>;
    get db(): LevelUp;
    safeGet(key: string): Promise<any>;
    constructor(_db: LevelUp, getUserFromUsername: (username: string) => Promise<{
        id?: string;
    }>);
    get(user: string, scope: string, key: string): Promise<any>;
    add(user: string, scope: string, value: any): Promise<string>;
    put(user: string, scope: string, key: string, value: any): Promise<void>;
    del(user: string, scope: string, key: string): Promise<void>;
    delAllUserData(user: string): Promise<void>;
    search(user: string, scope: string, options: SearchOptions): Promise<any[]>;
    batch(user: string, scope: string, batch: BatchOptions): Promise<void>;
}
