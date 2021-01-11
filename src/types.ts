export interface Session {
  id?: string;
  user: string;
  scopes: string[];
  readonly created: number;
}

export interface User {
  id?: string;
  readonly username: string;
  pass: string;
  salt: string;
}

export interface Config {
  readonly ip: string;
  readonly port: number;

  readonly sessionExpTime: number;
  readonly whitelist?: string[];

  readonly dbName: string;
}

interface QueryExpressionSegment<T extends object = any, U extends keyof T = any> {
  // comparison
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
  // logical
  readonly $or?: Query<T>[];
  readonly $and?: Query<T>[];
  readonly $nor?: Query<T>[];
  readonly $not?: Query<T>;
  // nominal field
  readonly [key: string]: any;
}

export type QueryExpression<T extends object = any, U extends keyof T = any> = (T[U] & QueryExpressionSegment<T, U>) | QueryExpressionSegment<T, U>;

export type Query<T extends object = any> = {
  readonly [P in keyof T]?: QueryExpression<T, P>
} & QuerySegment<T>;

export const QuerySegmentKeys = ['$or', '$and', '$nor', '$not'];
export const QueryExpressionSegmentKeys = ['$eq', '$ne', '$gt', '$lt', '$gte', '$lte', '$in', '$nin'];

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

export type BatchOptions = (BatchPut | BatchDel)[];
