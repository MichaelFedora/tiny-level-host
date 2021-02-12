import { LevelUp } from 'levelup';
import { AbstractIteratorOptions } from 'abstract-leveldown';
import { v4 } from 'uuid';
import { cloneDeep } from 'lodash';

import { BatchOptions, SearchOptions } from './types';
import { resolveQuery } from './util';

export class DataDB {

  public get db(): LevelUp { return this._db; }

  public async safeGet(key: string) { return this.db.get(key).catch(e => { if(e.notFound) return null; else throw e; }); }

  constructor(private _db: LevelUp, public getUserFromUsername: (username: string) => Promise<{ id?: string }>, private scope = '') {
    if(scope && !scope.endsWith('!!'))
      this.scope = scope + '!!';
  }

  async get(user: string, scope: string, key: string): Promise<any> {
    return this.safeGet(this.scope + 'db!!' + user + (scope ? '!!' + scope : '') + '!!' + key);
  }

  async add(user: string, scope: string, value: any): Promise<string> {
    delete value.id;

    let id: string;
    do {
      id = v4();
    } while(await this.get(user, scope, id) != null);
    await this.db.put(this.scope + 'db!!' + user + (scope ? '!!' + scope : '') + '!!' + id, value);
    return id;
  }

  async put(user: string, scope: string, key: string, value: any): Promise<void> {
    await this.db.put(this.scope + 'db!!' + user + (scope ? '!!' + scope : '') + '!!' + key, value);
  }

  async del(user: string, scope: string, key: string): Promise<void> {
    await this.db.del(this.scope + 'db!!' + user + (scope ? '!!' + scope : '') + '!!' + key);
  }

  async delAllUserData(user: string): Promise<void> {
    const start = this.scope + 'db!!' + user + '!!';
    const end = this.scope + 'db!!' + user + '!"';
    let batch = this.db.batch();
    await new Promise<any>(res => {
      const stream = this.db.createKeyStream({ gt: start, lt: end });
      stream.on('data', (key: string) => batch.del(key))
        .on('close', () => res(batch.write()));
    });
  }

  async search(user: string, scope: string, options: SearchOptions): Promise<any[]> {
    // here comes the fun part

    const ret: any[] = [];
    let count = 0;
    const skip = options.skip || 0;
    let destroyed = false;

    const opts = { } as AbstractIteratorOptions;

    const start = this.scope + 'db!!' + user + (scope ? '!!' + scope : '') + '!!' + (options.start || '');
    if(options.start) opts.gte = start;
    else opts.gt = start;

    const end = this.scope + 'db!!' + user + (scope ? '!!' + scope : '') + (options.end ? '!!' + options.end : '!"');
    if(options.end) opts.lte = end;
    else opts.lt = end;

    if(!options.query && options.limit != undefined && options.skip == undefined)
      opts.limit = options.limit;

    await new Promise<void>(res => {
      const stream = this.db.createReadStream(opts);
      stream.on('data', ({ key, value }: { key: string, value: any }) => {
        if(destroyed) return;
        const obj = Object.assign(value, { id: key });
        if(options.query) {
          if(!resolveQuery(options.query, cloneDeep(obj))) return;
          count++;
        }
        if(count <= options.skip) return;
        if((count - skip) > options.limit) { destroyed = true; (stream as any).destroy(); return; }
        ret.push(obj);
      }).on('close', () => res());
    });

    if(!options.projection?.length)
      return ret;

    const negate = options.projection[0].startsWith('-');
    let proj = options.projection.slice();
    if(negate)
      proj = proj.filter(b => b.startsWith('-')).map(b => b.slice(1));

    return ret.map(o => {
      const n: Partial<typeof o> = { };
      for(const key in o)
        if(negate ? !proj.includes(key) : proj.includes(key))
          n[o] = key;
      return n;
    })
  }

  async batch(user: string, scope: string, batch: BatchOptions): Promise<void> {
    for(const item of batch)
      item.key = this.scope + 'db!!' + user + (scope ? '!!' + scope : '') + '!!' + item.key;

    await this.db.batch(batch);
  }
}
