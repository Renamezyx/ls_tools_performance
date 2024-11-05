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
const nedb_1 = __importDefault(require("@seald-io/nedb"));
const utils_1 = require("./utils");
const calc_utils_1 = require("./calc-utils");
const gen_echarts_html_1 = require("./gen-echarts-html");
const open_1 = __importDefault(require("open"));
const lodash_1 = require("lodash");
const target = path_1.default.resolve(__dirname, './original-data');
const before = 0;
const after = 0;
const [, , _targetName] = process.argv;
const targetName = (_targetName !== null && _targetName !== void 0 ? _targetName : 'liveStudio').toLowerCase();
const getDBData = (db, times = 3) => __awaiter(void 0, void 0, void 0, function* () {
    const data = db.getAllData();
    if (data.length === 0 && times > 0) {
        yield (0, utils_1.sleep)();
        return getDBData(db, times - 1);
    }
    return data;
});
const getPerfData = (filename) => __awaiter(void 0, void 0, void 0, function* () {
    const db = new nedb_1.default({
        filename
    });
    yield db.loadDatabaseAsync();
    // 加载数据的时候是异步的，所以需要重试获取
    return yield getDBData(db);
});
const getCohostFpsData = (filename) => __awaiter(void 0, void 0, void 0, function* () {
    if (!filename) {
        return null;
    }
    const dataString = yield fs_1.default.promises.readFile(filename, {
        encoding: 'utf-8'
    });
    const rows = dataString.split('\n');
    const tsRe = /\[(\d+)\]/;
    const fpsRe = /cohost_fps_(\d+):(\d+)/g;
    const data = rows.map(row => {
        const tsRet = row.match(tsRe);
        const fpsList = [...row.matchAll(fpsRe)];
        if (tsRet && tsRet.length && fpsList && fpsList.length && fpsList.every(fps => fps.length)) {
            return Object.assign({ ts: Math.floor(Number(tsRet[1]) / 1000) }, fpsList.reduce((prev, cur) => {
                return Object.assign(Object.assign({}, prev), { [`cohost_fps_${cur[1]}`]: cur[2] });
            }, {}));
        }
        return null;
    });
    return data.filter(Boolean);
});
const getFpsData = (filename) => __awaiter(void 0, void 0, void 0, function* () {
    if (!filename) {
        return null;
    }
    const dataString = yield fs_1.default.promises.readFile(filename, {
        encoding: 'utf-8'
    });
    const rows = dataString.split('\n');
    const re = /\[(\d+)\](\S+:\d+,?)+;/;
    const data = rows.map(row => {
        const ret = row.match(re);
        if (ret && ret.length) {
            if (ret[2]) {
                const temp = ret[2].split(',').map(op => op.split(':')).map(op => {
                    const num = Number(op[1]);
                    return {
                        [op[0]]: isNaN(num) ? 0 : num
                    };
                }).reduce((prev, cur) => (Object.assign(Object.assign({}, prev), cur)), {
                    render_fps: 0,
                    encoder_fps: 0,
                    send_fps: 0,
                    encoder_fps_1: 0,
                    send_fps_1: 0,
                    camera_fps: 0,
                    camera_effect_fps: 0,
                    camera_render_duration: 0,
                    camera_effect_duration: 0,
                    preprocess_duration: 0,
                    camera_effect_algo_duration: 0,
                    camera_effect_render_duration: 0,
                    camera_effect_env_duration: 0,
                    ui_non_stuttering_duration: 0,
                    setting_bitrate: 0,
                    setting_bitrate_1: 0,
                    meta_video_bitrate: 0,
                    meta_video_bitrate_1: 0,
                    real_push_bitrate: 0,
                    real_push_bitrate_1: 0,
                    ui_fps_achieving_rate: 0
                });
                return Object.assign({ ts: Math.floor(Number(ret[1]) / 1000) }, temp);
            }
        }
        return null;
    });
    return data.filter(Boolean);
});
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const files = yield fs_1.default.promises.readdir(target);
    let fpsFilename = null;
    let perfFilename = null;
    let outputDirname = null;
    let cohostFpsFilename = null;
    files.forEach(f => {
        if (f.startsWith(`${targetName}_fps_`)) {
            fpsFilename = path_1.default.resolve(target, f);
        }
        else if (f.startsWith(`${targetName}_cohost_fps_`)) {
            cohostFpsFilename = path_1.default.resolve(target, f);
        }
        else if (f.startsWith(`${targetName}`)) {
            perfFilename = path_1.default.resolve(target, f);
            outputDirname = path_1.default.resolve(target, path_1.default.parse(perfFilename).name);
        }
    });
    if (fs_1.default.existsSync(outputDirname)) {
        yield fs_1.default.promises.rm(outputDirname, { recursive: true });
    }
    yield fs_1.default.promises.mkdir(outputDirname);
    const [perfData, fpsData, cohostFpsData] = yield Promise.all([
        getPerfData(perfFilename),
        getFpsData(fpsFilename),
        getCohostFpsData(cohostFpsFilename)
    ]);
    const _performanceData = (0, calc_utils_1.parsePerformance)((0, lodash_1.sortBy)(perfData, (it) => it.SystemTimeStamp), (0, lodash_1.sortBy)(fpsData, (it) => it.ts), (0, lodash_1.sortBy)(cohostFpsData, (it) => it.ts));
    const realStartTime = (0, lodash_1.first)(_performanceData).ts;
    const realEndTime = (0, lodash_1.last)(_performanceData).ts;
    const performanceData = _performanceData.filter(it => {
        return (it.ts >= (after !== null && after !== void 0 ? after : 0) + realStartTime) &&
            (it.ts <= realEndTime - (before !== null && before !== void 0 ? before : 0));
    });
    const htmlFilename = path_1.default.resolve(outputDirname, 'data.html');
    const csvFilename = path_1.default.resolve(outputDirname, 'data');
    const txtFilename = path_1.default.resolve(outputDirname, 'data.txt');
    yield (0, gen_echarts_html_1.genMultiEchartsHtml)(performanceData, htmlFilename, csvFilename);
    const text = (0, calc_utils_1.genText)(targetName, performanceData);
    console.log(text);
    yield fs_1.default.promises.writeFile(txtFilename, text, {
        flag: 'w+',
        encoding: 'utf-8'
    });
    yield (0, open_1.default)(htmlFilename, {
        app: {
            name: open_1.default.apps.chrome
        }
    });
});
main();
