import { pbkdf2 } from 'crypto';

import { Query, QueryExpression } from './types';
import { isEqual } from 'lodash';

export async function hash(salt: string, password: string) {
  return new Promise<string>((res, rej) => {
    pbkdf2(password, salt, 10000, 512, 'sha256', (err, data) => {
      if(err)
        return rej(err);
      else
        return res(data.toString('hex'));
    });
  });
}

/*
@todo: add '$[key].[key]...' accessor, i.e. { 'foo.bar.baz': 2 }
@todo: add '$key' accessor, i.e. { 'foo': { $eq: '$bar' } }
*/

export function resolveExpr<T extends object = any, U extends keyof T = any>(query: QueryExpression<T, U>, value: any): boolean {
  const keys = Object.keys(query);
  if(keys.length > 1) return resolveQuery<any>(query, value);
  const key = keys[0];
  switch(key) {
    case '$eq': return isEqual(query.$eq, value);
    case '$ne': return !isEqual(query.$ne, value);
    case '$gt': return query.$gt > value;
    case '$lt': return query.$lt < value;
    case '$gte': return query.$gte >= value;
    case '$lte': return query.$lte <= value;
    case '$in': return query.$in.includes(value);
    case '$nin': return !query.$nin.includes(value);
    default:
      if(typeof query[key] === 'object')
        return resolveQuery(query[key], value[key]);
      else
        return query[key] === value[key];
  }
}

export function resolveQuery<T extends object = any>(query: Query<T>, value: T): boolean {
  for(const key in query) {
    switch(key) {
      case '$or':
        let yay = false;

        for(const elem of query[key] as Query<T>[])
          if(resolveQuery(elem, value)) { yay = true; break; };

        if(!yay)
          return false;

        break;

      case '$and':
        for(const elem of query[key] as Query<T>[])
          if(!resolveQuery(elem, value)) return false;

        break;

      case '$nor':
        let nay = true;

        for(const elem of query[key] as Query<T>[])
          if(resolveQuery(elem, value)) { nay = false; break; };

        if(!nay)
          return false;

        break;

      case '$not':
        if(resolveQuery(query.$not, value))
          return false;
        break;

      default:
        if(typeof query[key] === 'object') {
          if(!resolveExpr(query[key], value[key]))
            return false;
        } else if(query[key] === value[key])
          return false;
    }
  }

  return true;
}
