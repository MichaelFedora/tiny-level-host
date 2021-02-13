import { NextFunction, Request, Response, Router } from 'express';
import { handleError } from 'tiny-host-common';
import { LevelDB } from './level-db';
export declare class LevelApi {
    private _router;
    get router(): Router;
    constructor(db: LevelDB, sessionValidator: (req: Request, res: Response, next: NextFunction) => void, router?: import("express-serve-static-core").Router, errorHandler?: typeof handleError);
}
