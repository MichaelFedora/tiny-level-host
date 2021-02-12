import { Router } from 'express';

import { AuthApi, validateUserSession, User, handleError } from 'tiny-host-common';
import { DataApi } from '../lib';

import { Config } from './types';
import db from './db';

class Api {

  private _router: Router;
  public get router() { return this._router; }

  constructor() { }

  init(config: Config) {

    this._router = Router();

    const onUserDelete = async (user: User) => {
      try {
        await db.data.delAllUserData(user.id);
      } catch(e) {
        console.error('Error deleting user info!', e); // should I re-throw?
      }
    };

    const validateSession = validateUserSession(db.auth);

    AuthApi.init(config, db.auth, onUserDelete, this.router);
    DataApi.init(db.data, validateSession, this.router, handleError);

    this.router.use(handleError('api'));
  }
}

export default new Api();
