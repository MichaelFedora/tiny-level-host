interface QueryExpressionSegment<T extends object = any, U extends keyof T = any> {
    readonly $eq?: T[U];
    readonly $ne?: T[U];
    readonly $gt?: T[U];
    readonly $lt?: T[U];
    readonly $gte?: T[U];
    readonly $lte?: T[U];
    readonly $in?: T[U][];
    readonly $nin?: T[U][];
}
interface QuerySegment<T extends object = any> {
    readonly $or?: Query<T>[];
    readonly $and?: Query<T>[];
    readonly $nor?: Query<T>[];
    readonly $not?: Query<T>;
    readonly [key: string]: any;
}
export declare type QueryExpression<T extends object = any, U extends keyof T = any> = (T[U] & QueryExpressionSegment<T, U>) | QueryExpressionSegment<T, U>;
export declare type Query<T extends object = any> = {
    readonly [P in keyof T]?: QueryExpression<T, P>;
} & QuerySegment<T>;
export declare const QuerySegmentKeys: string[];
export declare const QueryExpressionSegmentKeys: string[];
export interface SearchOptions<T extends object = any> {
    readonly start?: string | number;
    readonly end?: string | number;
    readonly skip?: number;
    readonly limit?: number;
    readonly query?: Query<T>;
    readonly projection?: string[];
}
interface BatchPut {
    readonly type: 'put';
    key: string;
    readonly value: any;
}
interface BatchDel {
    readonly type: 'del';
    key: string;
}
export declare type BatchOptions = (BatchPut | BatchDel)[];
export {};
