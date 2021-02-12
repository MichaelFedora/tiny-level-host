import { json, NextFunction, Request, Response, Router } from 'express';
import { wrapAsync, handleError, NotAllowedError } from 'tiny-host-common';

import { DataDB } from './data-db';

export class DataApi {

  private _router: Router;
  public get router() { return this._router; }

  constructor(db: DataDB,
    sessionValidator: (req: Request, res: Response, next: NextFunction) => void,
    router = Router(),
    errorHandler = handleError) {

    this._router = router;

    const dbRouter = Router({ mergeParams: true });

    dbRouter.use('/:scope/:key', sessionValidator, (req, _, next) => {
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

    router.use('/db', dbRouter, errorHandler('db'));

    // search

    router.post('/search', sessionValidator, json(), wrapAsync(async (req, res) => {
      if(req.session.scopes.includes('/'))
        throw new NotAllowedError('Can only search root if scope is global ("/")!');

      res.json(await db.search(req.user.id, '', req.body))
    }), errorHandler('search-global'));

    router.post('/search/:scope', sessionValidator, json(), wrapAsync(async (req, res) => {
      if(!req.session.scopes.includes(req.params.scope))
        throw new NotAllowedError('Scope not allowed!');

      res.json(await db.search(req.user.id, req.params.scope, req.body))
    }), errorHandler('search-scope'));

    // batch

    router.post('/batch', sessionValidator, json(), wrapAsync(async (req, res) => {
      if(req.session.scopes.includes('/'))
        throw new NotAllowedError('Can only batch root if scope is global ("/")!');

      res.json(await db.batch(req.user.id, '', req.body))
    }), errorHandler('batch-global'));

    router.post('/batch/:scope', sessionValidator, json(), wrapAsync(async (req, res) => {
      if(!req.session.scopes.includes(req.params.scope))
        throw new NotAllowedError('Scope not allowed!');

      res.json(await db.batch(req.user.id, req.params.scope, req.body))
    }), errorHandler('batch-scope'));
  }
}
