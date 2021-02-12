import { NextFunction, Request, Response, Router } from 'express';
import { handleError } from 'tiny-host-common';
import { DataDB } from './data-db';
export declare class DataApi {
    private _router;
    get router(): Router;
    constructor(db: DataDB, sessionValidator: (req: Request, res: Response, next: NextFunction) => void, router?: import("express-serve-static-core").Router, errorHandler?: typeof handleError);
}
