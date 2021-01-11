import * as level from 'level';
import { LevelUp } from 'levelup';
import { AbstractIteratorOptions } from 'abstract-leveldown';
import { v4 } from 'uuid';
import { cloneDeep } from 'lodash';

import { BatchOptions, Config, SearchOptions, Session, User } from './types';
import { resolveQuery } from './util';

class DB {

  private sessionExpTime = 604800000;

  private _db: LevelUp & { safeGet(key: string): Promise<any> };
  public get db(): LevelUp & { safeGet(key: string): Promise<any> } { return this._db; }

  constructor() { }

  init(config: Config) {
    this._db = level(config.dbName, { valueEncoding: 'json' }) as any;
    this._db.safeGet = (key: string) => this._db.get(key).catch(e => { if(e.notFound) return null; else throw e; });
    this.sessionExpTime = config.sessionExpTime;
  }

  close() { return this.db.close(); }

  // auth

  async addSession(user: string, scopes = ['/']): Promise<string> {
    let id: string;
    do {
      id = v4();
    } while(await this.getSession(id) != null);
    await this.db.put('session!!' + id, { user, created: Date.now(), scopes });
    return id;
  }

  async getSession(session: string): Promise<Session> {
    const s = await this.db.safeGet('session!!' + session);
    if(s) s.id = session;
    return s;
  }

  async delSession(session: string): Promise<void> {
    return await this.db.del('session!!' + session);
  }

  async cleanSessions(): Promise<void> {
    const sessions: string[] = [];
    const start = 'session!!';
    const end = 'session!"'
    await new Promise<void>(res => {
      const stream = this.db.createReadStream({ gt: start, lt: end });
      stream.on('data', ({ key, value }: { key: string, value: Session }) => {
        if((value.created + this.sessionExpTime) > Date.now())
          sessions.push(key);
      }).on('close', () => res());
    });
    let batch = this.db.batch();
    for(const sess of sessions)
      batch = batch.del(sess);
    await batch.write();
  }

  async addUser(user: User): Promise<string> {
    delete user.id;

    let id: string;
    do {
      id = v4();
    } while(await this.getUser(id) != null);
    await this.db.put('user!!' + id, user);
    return id;
  }

  async putUser(id: string, user: User): Promise<void> {
    delete user.id;

    await this.db.put('user!!' + id, user);
  }

  async getUser(id: string): Promise<User> {
    const u = await this.db.safeGet('user!!' + id);
    if(u) u.id = id;
    return u;
  }

  async delUser(id: string): Promise<void> {
    return await this.db.del('user!!' + id);
  }

  async getUserFromUsername(username: string): Promise<User> {
    let destroyed = false;
    const start = 'user!!';
    const end = 'user!"'
    return await new Promise<User>(res => {
      const stream = this.db.createValueStream({ gt: start, lt: end });
      stream.on('data', (value: User) => {
        if(!destroyed && value.username === username) {
          destroyed = true;
          res(value);
          (stream as any).destroy();
        }
      }).on('close', () => destroyed ? null : res(null));
    });
  }

  // db

  async get(user: string, scope: string, key: string): Promise<any> {
    return this.db.safeGet('db!!' + user + (scope ? '!!' + scope : '') + '!!' + key);
  }

  async add(user: string, scope: string, value: any): Promise<string> {
    delete value.id;

    let id: string;
    do {
      id = v4();
    } while(await this.get(user, scope, id) != null);
    await this.db.put('db!!' + user + (scope ? '!!' + scope : '') + '!!' + id, value);
    return id;
  }

  async put(user: string, scope: string, key: string, value: any): Promise<void> {
    await this.db.put('db!!' + user + (scope ? '!!' + scope : '') + '!!' + key, value);
  }

  async del(user: string, scope: string, key: string): Promise<void> {
    await this.db.del('db!!' + user + (scope ? '!!' + scope : '') + '!!' + key);
  }

  async search(user: string, scope: string, options: SearchOptions): Promise<any[]> {
    // here comes the fun part

    const ret: any[] = [];
    let count = 0;
    const skip = options.skip || 0;
    let destroyed = false;

    const opts = { } as AbstractIteratorOptions;

    const start = 'db!!' + user + (scope ? '!!' + scope : '') + '!!' + (options.start || '');
    if(options.start) opts.gte = start;
    else opts.gt = start;

    const end = 'db!!' + user + (scope ? '!!' + scope : '') + (options.end ? '!!' + options.end : '!"');
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
      item.key = 'db!!' + user + (scope ? '!!' + scope : '') + '!!' + item.key;

    await this.db.batch(batch);
  }
}

export default new DB();
