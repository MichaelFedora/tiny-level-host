"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LevelApi = void 0;
const express_1 = require("express");
const tiny_host_common_1 = require("tiny-host-common");
class LevelApi {
    constructor(db, sessionValidator, router = express_1.Router(), errorHandler = tiny_host_common_1.handleError) {
        this._router = router;
        const dbRouter = express_1.Router({ mergeParams: true });
        dbRouter.use('/:scope/:key', sessionValidator, (req, _, next) => {
            if (!req.session.scopes.includes(req.params.scope))
                throw new tiny_host_common_1.NotAllowedError('Key out of scope(s)!');
            next();
        });
        dbRouter.get('/:scope/:key', tiny_host_common_1.wrapAsync(async (req, res) => {
            res.json(await db.get(req.user.id, req.params.scope, req.params.key));
        }));
        dbRouter.post('/:scope', express_1.json(), tiny_host_common_1.wrapAsync(async (req, res) => {
            delete req.body.id;
            res.json(await db.add(req.user.id, req.params.scope, req.body));
        }));
        dbRouter.put('/:scope/:key', express_1.json(), tiny_host_common_1.wrapAsync(async (req, res) => {
            delete req.body.id;
            await db.put(req.user.id, req.params.scope, req.params.key, req.body);
            res.sendStatus(204);
        }));
        dbRouter.delete('/:scope/:key', tiny_host_common_1.wrapAsync(async (req, res) => {
            await db.del(req.user.id, req.params.scope, req.params.key);
            res.sendStatus(204);
        }));
        router.use('/db', dbRouter, errorHandler('db'));
        // search
        router.post('/search', sessionValidator, express_1.json(), tiny_host_common_1.wrapAsync(async (req, res) => {
            if (req.session.scopes.includes('/'))
                throw new tiny_host_common_1.NotAllowedError('Can only search root if scope is global ("/")!');
            res.json(await db.search(req.user.id, '', req.body));
        }), errorHandler('search-global'));
        router.post('/search/:scope', sessionValidator, express_1.json(), tiny_host_common_1.wrapAsync(async (req, res) => {
            if (!req.session.scopes.includes(req.params.scope))
                throw new tiny_host_common_1.NotAllowedError('Scope not allowed!');
            res.json(await db.search(req.user.id, req.params.scope, req.body));
        }), errorHandler('search-scope'));
        // batch
        router.post('/batch', sessionValidator, express_1.json(), tiny_host_common_1.wrapAsync(async (req, res) => {
            if (req.session.scopes.includes('/'))
                throw new tiny_host_common_1.NotAllowedError('Can only batch root if scope is global ("/")!');
            res.json(await db.batch(req.user.id, '', req.body));
        }), errorHandler('batch-global'));
        router.post('/batch/:scope', sessionValidator, express_1.json(), tiny_host_common_1.wrapAsync(async (req, res) => {
            if (!req.session.scopes.includes(req.params.scope))
                throw new tiny_host_common_1.NotAllowedError('Scope not allowed!');
            res.json(await db.batch(req.user.id, req.params.scope, req.body));
        }), errorHandler('batch-scope'));
    }
    get router() { return this._router; }
}
exports.LevelApi = LevelApi;
