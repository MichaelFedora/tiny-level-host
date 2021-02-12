import { Query, QueryExpression } from './types';
export declare function resolveExpr<T extends object = any, U extends keyof T = any>(query: QueryExpression<T, U>, value: any): boolean;
export declare function resolveQuery<T extends object = any>(query: Query<T>, value: T): boolean;
