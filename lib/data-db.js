"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataDB = void 0;
const uuid_1 = require("uuid");
const lodash_1 = require("lodash");
const util_1 = require("./util");
class DataDB {
    constructor(_db, getUserFromUsername, scope = '') {
        this._db = _db;
        this.getUserFromUsername = getUserFromUsername;
        this.scope = scope;
        if (scope && !scope.endsWith('!!'))
            this.scope = scope + '!!';
    }
    get db() { return this._db; }
    async safeGet(key) { return this.db.get(key).catch(e => { if (e.notFound)
        return null;
    else
        throw e; }); }
    async get(user, scope, key) {
        return this.safeGet(this.scope + 'db!!' + user + (scope ? '!!' + scope : '') + '!!' + key);
    }
    async add(user, scope, value) {
        delete value.id;
        let id;
        do {
            id = uuid_1.v4();
        } while (await this.get(user, scope, id) != null);
        await this.db.put(this.scope + 'db!!' + user + (scope ? '!!' + scope : '') + '!!' + id, value);
        return id;
    }
    async put(user, scope, key, value) {
        await this.db.put(this.scope + 'db!!' + user + (scope ? '!!' + scope : '') + '!!' + key, value);
    }
    async del(user, scope, key) {
        await this.db.del(this.scope + 'db!!' + user + (scope ? '!!' + scope : '') + '!!' + key);
    }
    async delAllUserData(user) {
        const start = this.scope + 'db!!' + user + '!!';
        const end = this.scope + 'db!!' + user + '!"';
        let batch = this.db.batch();
        await new Promise(res => {
            const stream = this.db.createKeyStream({ gt: start, lt: end });
            stream.on('data', (key) => batch.del(key))
                .on('close', () => res(batch.write()));
        });
    }
    async search(user, scope, options) {
        // here comes the fun part
        var _a;
        const ret = [];
        let count = 0;
        const skip = options.skip || 0;
        let destroyed = false;
        const opts = {};
        const start = this.scope + 'db!!' + user + (scope ? '!!' + scope : '') + '!!' + (options.start || '');
        if (options.start)
            opts.gte = start;
        else
            opts.gt = start;
        const end = this.scope + 'db!!' + user + (scope ? '!!' + scope : '') + (options.end ? '!!' + options.end : '!"');
        if (options.end)
            opts.lte = end;
        else
            opts.lt = end;
        if (!options.query && options.limit != undefined && options.skip == undefined)
            opts.limit = options.limit;
        await new Promise(res => {
            const stream = this.db.createReadStream(opts);
            stream.on('data', ({ key, value }) => {
                if (destroyed)
                    return;
                const obj = Object.assign(value, { id: key });
                if (options.query) {
                    if (!util_1.resolveQuery(options.query, lodash_1.cloneDeep(obj)))
                        return;
                    count++;
                }
                if (count <= options.skip)
                    return;
                if ((count - skip) > options.limit) {
                    destroyed = true;
                    stream.destroy();
                    return;
                }
                ret.push(obj);
            }).on('close', () => res());
        });
        if (!((_a = options.projection) === null || _a === void 0 ? void 0 : _a.length))
            return ret;
        const negate = options.projection[0].startsWith('-');
        let proj = options.projection.slice();
        if (negate)
            proj = proj.filter(b => b.startsWith('-')).map(b => b.slice(1));
        return ret.map(o => {
            const n = {};
            for (const key in o)
                if (negate ? !proj.includes(key) : proj.includes(key))
                    n[o] = key;
            return n;
        });
    }
    async batch(user, scope, batch) {
        for (const item of batch)
            item.key = this.scope + 'db!!' + user + (scope ? '!!' + scope : '') + '!!' + item.key;
        await this.db.batch(batch);
    }
}
exports.DataDB = DataDB;
