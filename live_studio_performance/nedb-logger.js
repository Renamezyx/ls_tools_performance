"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
/**
 * https://github.com/louischatriot/nedb/issues/63
 * https://github.com/louischatriot/nedb-logger/blob/master/index.js
 */
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const persistence_1 = __importDefault(require("@seald-io/nedb/lib/persistence"));
const model_1 = __importDefault(require("@seald-io/nedb/lib/model"));
const customUtils_1 = __importDefault(require("@seald-io/nedb/lib/customUtils"));
const mkdirp_1 = require("mkdirp");
class Logger {
    constructor(dbOptions) {
        dbOptions.inMemoryOnly = false;
        dbOptions.autoload = false;
        this.persistence = new persistence_1.default({ db: dbOptions });
        // Make sure file and containing directory exist, create them if they don't
        mkdirp_1.mkdirp.sync(path_1.default.dirname(dbOptions.filename));
        if (!fs_1.default.existsSync(dbOptions.filename)) {
            fs_1.default.writeFileSync(dbOptions.filename, '', 'utf8');
        }
    }
    insert(_docs) {
        return __awaiter(this, void 0, void 0, function* () {
            const docs = Array.isArray(_docs) ? _docs : [_docs];
            const preparedDocs = [];
            try {
                docs.forEach(function (doc) {
                    preparedDocs.push(model_1.default.deepCopy(doc));
                });
                preparedDocs.forEach(function (doc) {
                    doc._id = customUtils_1.default.uid(16);
                    model_1.default.checkObject(doc);
                });
                yield this.persistence.persistNewStateAsync(preparedDocs);
                return true;
            }
            catch (err) {
                console.error('logger insert fail.', err);
                return false;
            }
        });
    }
}
exports.Logger = Logger;
