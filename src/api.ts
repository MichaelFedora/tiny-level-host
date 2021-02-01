import { randomBytes } from 'crypto';
import { json, Router } from 'express';

import { AuthError, MalformedError, NotAllowedError } from './errors';
import { Config, User } from './types';
import { handleError, handleValidationError, parseTrue, validateSession, wrapAsync } from './middleware';
import { hash } from './util';

import db from './db';

class Api {

  private _router: Router;
  public get router() { return this._router; }

  constructor() { }

  init(config: Config) {

    this._router = Router();

    // auth

    const authRouter = Router();

    authRouter.post('/login', json(), wrapAsync(async (req, res) => {
      if(config.whitelist && !config.whitelist.includes(req.body.username))
        throw new AuthError('Whitelist is active.');

      if(!req.body.scopes || !(req.body.scopes instanceof Array))
        throw new AuthError('Must provide scope(s)!');

      const user = await db.getUserFromUsername(req.body.username);
      if(!user)
        throw new AuthError('Username / password mismatch.');

      const pass = await hash(user.salt, req.body.password);
      if(user.pass !== pass)
        throw new AuthError('Username / password mismatch.');

      res.send(await db.addSession(user.id, req.body.scopes ));
    }), handleValidationError);

    authRouter.use(handleError('auth'));

    authRouter.post('/register', json(), wrapAsync(async (req, res) => {
      if(!req.body.username || !req.body.password)
        throw new MalformedError('Must have a username and password!');

      if(config.whitelist && !config.whitelist.includes(req.body.username))
        throw new NotAllowedError('Whitelist is active.');

      if(await db.getUserFromUsername(req.body.username))
        throw new NotAllowedError('Username taken!');

      const salt = randomBytes(128).toString('hex');
      const user: User = {
        username: req.body.username,
        salt,
        pass: await hash(salt, req.body.password)
      };

      await db.addUser(user);
      res.sendStatus(204);
    }));

    authRouter.post('/change-pass', validateSession(), json(), wrapAsync(async (req, res) => {
      if(!req.body.password || !req.body.newpass)
        throw new MalformedError('Body must have a password, and a newpass.');

      if(await hash(req.user.salt, req.body.password) !== req.user.pass)
        throw new NotAllowedError('Password mismatch.');

      const salt = randomBytes(128).toString('hex');
      const pass = hash(salt, req.body.newpass);

      await db.putUser(req.user.id, Object.assign(req.user, { salt, pass }));
      const sessions = await db.getSessionsForUser(req.user.id);
      await db.delManySessions(sessions.filter(a => a !== req.session.id));
    }));

    authRouter.post('/logout', validateSession(), wrapAsync(async (req, res) => {
      await db.delSession(req.session.id);
      res.sendStatus(204);
    }));

    authRouter.get('/refresh', validateSession(), wrapAsync(async (req, res) => {
      const sess = await db.addSession(req.user.id, req.session.scopes);
      await db.delSession(req.session.id);
      res.json(sess);
    }));

    this.router.use('/auth', authRouter);
    this.router.delete('/self', validateSession(), wrapAsync(async (req, res) => {
      if(req.user) {
        await db.delUser(req.user.id);
        await db.delAllUserData(req.user.id);
      }
      res.sendStatus(204);
    }));

    // db

    const dbRouter = Router({ mergeParams: true });

    dbRouter.use('/:scope/:key', validateSession(), (req, _, next) => {
      if(!req.session.scopes.includes(req.params.scope))
        throw new NotAllowedError('Key out of scope(s)!');

      next();
    });

    dbRouter.get('/:scope/:key', wrapAsync(async (req, res) => {
      res.json(await db.get(req.user.id, req.params.scope, req.params.key));
    }));

    dbRouter.post('/:scope', json(), wrapAsync(async (req, res) => {
      delete req.body.id;

      res.json(await db.add(req.user.id, req.params.scope, req.body));
    }));

    dbRouter.put('/:scope/:key', json(), wrapAsync(async (req, res) => {
      delete req.body.id;

      await db.put(req.user.id, req.params.scope, req.params.key, req.body);

      res.sendStatus(204);
    }));

    dbRouter.delete('/:scope/:key', wrapAsync(async (req, res) => {
      await db.del(req.user.id, req.params.scope, req.params.key);

      res.sendStatus(204);
    }));

    this.router.use('/db', dbRouter, handleError('db'));

    // search

    this.router.post('/search', validateSession(), json(), wrapAsync(async (req, res) => {
      if(req.session.scopes.includes('/'))
        throw new NotAllowedError('Can only search root if scope is global ("/")!');

      res.json(await db.search(req.user.id, '', req.body))
    }), handleError('search-global'));

    this.router.post('/search/:scope', validateSession(), json(), wrapAsync(async (req, res) => {
      if(!req.session.scopes.includes(req.params.scope))
        throw new NotAllowedError('Scope not allowed!');

      res.json(await db.search(req.user.id, req.params.scope, req.body))
    }), handleError('search-scope'));

    // batch

    this.router.post('/batch', validateSession(), json(), wrapAsync(async (req, res) => {
      if(req.session.scopes.includes('/'))
        throw new NotAllowedError('Can only batch root if scope is global ("/")!');

      res.json(await db.batch(req.user.id, '', req.body))
    }), handleError('batch-global'));

    this.router.post('/batch/:scope', validateSession(), json(), wrapAsync(async (req, res) => {
      if(!req.session.scopes.includes(req.params.scope))
        throw new NotAllowedError('Scope not allowed!');

      res.json(await db.batch(req.user.id, req.params.scope, req.body))
    }), handleError('batch-scope'));

    this.router.use(handleError('api'));
  }
}

export default new Api();
