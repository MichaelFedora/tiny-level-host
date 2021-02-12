import { NextFunction, Request, Response } from 'express';
import { handleError } from 'tiny-host-common';
import { DataDB } from './data-db';
declare class DataApi {
    init(db: DataDB, sessionValidator: (req: Request, res: Response, next: NextFunction) => void, router?: import("express-serve-static-core").Router, errorHandler?: typeof handleError): void;
}
declare const _default: DataApi;
export default _default;
