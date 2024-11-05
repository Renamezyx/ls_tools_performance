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
exports.AutoQueue = exports.getKeys = exports.writeToCSV = exports.sleep = exports.safeJSONParse = exports.formatBytes = exports.humanReadableNumber = exports.toFixed = exports.avg = void 0;
const fs_1 = __importDefault(require("fs"));
const json_bigint_1 = __importDefault(require("json-bigint"));
const csv_stringify_1 = require("csv-stringify");
const JSONBigInt = (0, json_bigint_1.default)({ storeAsString: true });
const avg = (sum, count, decimals = 2) => {
    return Number((sum / count).toFixed(decimals));
};
exports.avg = avg;
const toFixed = (str, fractionDigits = 2) => {
    return Number(str.toFixed(fractionDigits));
};
exports.toFixed = toFixed;
// see https://bytedance.feishu.cn/wiki/wikcnIXtzKY6mJl2UVIoHbmwYEb#0x7zC4
const humanReadableNumber = (originNumber) => {
    const B = Math.pow(1000, 3);
    const M = Math.pow(1000, 2);
    const K = 1000;
    if (originNumber >= B) {
        return `${(0, exports.toFixed)(originNumber / B, 1)}B`;
    }
    if (originNumber >= M) {
        return `${(0, exports.toFixed)(originNumber / M, 1)}M`;
    }
    if (originNumber >= K) {
        return `${(0, exports.toFixed)(originNumber / K, 1)}K`;
    }
    return `${(0, exports.toFixed)(originNumber, 1)}`;
};
exports.humanReadableNumber = humanReadableNumber;
const sizes = [
    'Bytes',
    'KB',
    'MB',
    'GB',
    'TB',
    'PB',
    'EB',
    'ZB',
    'YB'
];
function formatBytes(bytes, base, decimals = 2) {
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    let i = -1;
    if (base) {
        i = sizes.findIndex(size => size === base);
    }
    else {
        i = Math.floor(Math.log(bytes) / Math.log(k));
    }
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
}
exports.formatBytes = formatBytes;
const safeJSONParse = (jsonString, reviver) => {
    try {
        return JSONBigInt.parse(jsonString, reviver);
    }
    catch (e) {
        return {};
    }
};
exports.safeJSONParse = safeJSONParse;
const sleep = (wait = 1000) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise(resolve => {
        setTimeout(resolve, wait);
    });
});
exports.sleep = sleep;
const writeToCSV = (records, pathname) => __awaiter(void 0, void 0, void 0, function* () {
    const ret = yield new Promise((resolve, reject) => {
        (0, csv_stringify_1.stringify)(records, { header: true }, (err, output) => {
            if (err) {
                console.error(err);
                reject(err);
            }
            else {
                resolve(output);
            }
        });
    });
    yield fs_1.default.promises.writeFile(pathname, ret, { encoding: 'utf-8' });
});
exports.writeToCSV = writeToCSV;
function getKeys(val) {
    return Object.keys(val);
}
exports.getKeys = getKeys;
class AutoQueue {
    constructor() {
        this.pendingPromise = false;
        this.task = [];
        this.enqueue = (action) => __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.task.push({
                    action,
                    resolve,
                    reject
                });
                this.dequeue();
            });
        });
        this.dequeue = () => __awaiter(this, void 0, void 0, function* () {
            if (this.pendingPromise) {
                return;
            }
            const item = this.task.shift();
            if (!item) {
                return;
            }
            this.pendingPromise = true;
            try {
                const payload = yield item.action();
                this.pendingPromise = false;
                item.resolve(payload);
            }
            catch (e) {
                console.error(e);
                this.pendingPromise = false;
                item.reject(e);
            }
            finally {
                // 避免阻塞主流程
                yield (0, exports.sleep)(0);
                this.dequeue();
            }
        });
    }
}
exports.AutoQueue = AutoQueue;
