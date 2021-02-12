import { Router } from 'express';

import { AuthApi, validateUserSession, User, handleError } from 'tiny-host-common';
import { DataApi } from '../lib';

import { Config } from './types';
import db from './db';

class Api {

  private _router: Router;
  public get router() { return this._router; }

  private _authApi: AuthApi;
  public get authApi() { return this._authApi; }

  private _dataApi: DataApi;
  public get dataApi() { return this._dataApi; }

  constructor() { }

  init(config: Config) {

    this._router = Router();

    const validateSession = validateUserSession(db.auth);

    this._authApi = new AuthApi(config, db.auth, this.router);
    this._dataApi = new DataApi(db.data, validateSession, this.router, handleError);

    this.router.use(handleError('api'));
  }
}

export default new Api();
