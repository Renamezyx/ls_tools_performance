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
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const target = path_1.default.resolve(__dirname, './original-data');
const targetName = 'obs64';
const getFpsData = (filename) => __awaiter(void 0, void 0, void 0, function* () {
    if (!filename) {
        return null;
    }
    const dataString = yield fs_1.default.promises.readFile(filename, {
        encoding: 'utf-8'
    });
    const rows = dataString.split('\n');
    const re = /\[(\S+)\]\[(\d+)\](\S+:\d+,?)+;/;
    const dataMap = {};
    rows.forEach(row => {
        const ret = row.match(re);
        if (ret && ret.length) {
            const rowType = ret[1];
            const temp = ret[3].split(',').map(op => op.split(':')).map(op => {
                const num = Number(op[1]);
                return {
                    [op[0]]: isNaN(num) ? 0 : num
                };
            }).reduce((prev, cur) => (Object.assign(Object.assign({}, prev), cur)), {
                render_fps: 0,
                encoder_fps: 0,
                send_fps: 0
            });
            if (!dataMap[rowType]) {
                dataMap[rowType] = [];
            }
            dataMap[rowType].push(temp);
        }
    });
    return dataMap;
});
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const files = yield fs_1.default.promises.readdir(target);
    let fpsFilename = null;
    files.forEach(f => {
        if (f.startsWith(`${targetName}_fps_`)) {
            fpsFilename = path_1.default.resolve(target, f);
        }
    });
    const fpsData = yield getFpsData(fpsFilename);
    const ret = {};
    Object.keys(fpsData).forEach((rowType) => {
        if (!ret[rowType]) {
            ret[rowType] = {};
        }
        fpsData[rowType].forEach((data) => {
            Object.keys(data).forEach(key => {
                var _a;
                ret[rowType][key] = ((_a = ret[rowType][key]) !== null && _a !== void 0 ? _a : 0) + Number(data[key]);
            });
        });
    });
    Object.keys(ret).forEach((rowType) => {
        const data = ret[rowType];
        Object.keys(data).forEach((key) => {
            ret[rowType][key] = ret[rowType][key] / fpsData[rowType].length;
        });
    });
    console.log(ret);
    return ret;
});
main();
