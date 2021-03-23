import { Router } from 'express';

import { AuthApi, validateUserSession, User, handleError } from 'tiny-host-common';
import { LevelApi } from '../lib';

import { Config } from './types';
import db from './db';

class Api {

  private _router: Router;
  public get router() { return this._router; }

  private _authApi: AuthApi;
  public get authApi() { return this._authApi; }

  private _levelApi: LevelApi;
  public get levelApi() { return this._levelApi; }

  constructor() { }

  init(config: Config) {

    this._router = Router();

    const validateSession = validateUserSession(db.auth);

    this.router.get('/type', (_, res) => res.send('db'));

    this._authApi = new AuthApi({
      whitelist: config.whitelist,
      handshakeExpTime: config.handshakeExpTime,
      requireScopes: true,
      allowHandshakes: true,
      allowMasterKeys: true
    }, db.auth, this.router);
    this._levelApi = new LevelApi(db.level, validateSession, this.router, handleError);

    this.router.use(handleError('api'));
  }
}

export default new Api();
