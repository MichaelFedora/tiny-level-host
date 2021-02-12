"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataDB = exports.DataApi = void 0;
const data_api_1 = require("./data-api");
exports.DataApi = data_api_1.default;
const data_db_1 = require("./data-db");
Object.defineProperty(exports, "DataDB", { enumerable: true, get: function () { return data_db_1.DataDB; } });
