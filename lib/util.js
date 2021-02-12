"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveQuery = exports.resolveExpr = void 0;
const lodash_1 = require("lodash");
/*
@todo: add '$[key].[key]...' accessor, i.e. { 'foo.bar.baz': 2 }
@todo: add '$key' accessor, i.e. { 'foo': { $eq: '$bar' } }
*/
function resolveExpr(query, value) {
    const keys = Object.keys(query);
    if (keys.length > 1)
        return resolveQuery(query, value);
    const key = keys[0];
    switch (key) {
        case '$eq': return lodash_1.isEqual(query.$eq, value);
        case '$ne': return !lodash_1.isEqual(query.$ne, value);
        case '$gt': return query.$gt > value;
        case '$lt': return query.$lt < value;
        case '$gte': return query.$gte >= value;
        case '$lte': return query.$lte <= value;
        case '$in': return query.$in.includes(value);
        case '$nin': return !query.$nin.includes(value);
        default:
            if (typeof query[key] === 'object')
                return resolveQuery(query[key], value[key]);
            else
                return query[key] === value[key];
    }
}
exports.resolveExpr = resolveExpr;
function resolveQuery(query, value) {
    for (const key in query) {
        switch (key) {
            case '$or':
                let yay = false;
                for (const elem of query[key])
                    if (resolveQuery(elem, value)) {
                        yay = true;
                        break;
                    }
                ;
                if (!yay)
                    return false;
                break;
            case '$and':
                for (const elem of query[key])
                    if (!resolveQuery(elem, value))
                        return false;
                break;
            case '$nor':
                let nay = true;
                for (const elem of query[key])
                    if (resolveQuery(elem, value)) {
                        nay = false;
                        break;
                    }
                ;
                if (!nay)
                    return false;
                break;
            case '$not':
                if (resolveQuery(query.$not, value))
                    return false;
                break;
            default:
                if (typeof query[key] === 'object') {
                    if (!resolveExpr(query[key], value[key]))
                        return false;
                }
                else if (query[key] === value[key])
                    return false;
        }
    }
    return true;
}
exports.resolveQuery = resolveQuery;
