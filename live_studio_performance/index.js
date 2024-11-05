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
const inquirer_1 = __importDefault(require("inquirer"));
const dayjs_1 = __importDefault(require("dayjs"));
const open_1 = __importDefault(require("open"));
const lodash_1 = require("lodash");
const config_1 = require("./config");
const detection_manager_1 = require("./detection-manager");
const utils_1 = require("./utils");
const gen_echarts_html_1 = require("./gen-echarts-html");
const calc_utils_1 = require("./calc-utils");
const startTs = (0, dayjs_1.default)();
const [, , _targetName, duration] = process.argv;
const targetName = (_targetName !== null && _targetName !== void 0 ? _targetName : 'liveStudio').toLowerCase();
const config = config_1.configs[targetName];
if (!config) {
    throw new Error(`${targetName} can not find in config`);
}
// 生成的 txt，html，csv 等文件
const outputDir = path_1.default.resolve(process.cwd(), `./output/${targetName}__${startTs.format('YYYY_MM_DD_HH_mm_ss')}/`);
if (!fs_1.default.existsSync(outputDir)) {
    fs_1.default.mkdirSync(outputDir, { recursive: true });
}
const handleEndResponse = () => __awaiter(void 0, void 0, void 0, function* () {
    if ((0, lodash_1.isNil)(duration)) {
        const resp = yield inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'shouldFinish',
                message: '是否停止程序'
            }
        ]);
        if (resp.shouldFinish) {
            return true;
        }
        return handleEndResponse();
    }
    console.log('程序将会在', duration, '秒后停止');
    yield (0, utils_1.sleep)((Number(duration) + 1) * 1000);
    return true;
});
const genDataFilename = (ts, suffix) => {
    return path_1.default.resolve(outputDir, `${targetName}_${ts.format('YYYY_MM_DD_HH_mm_ss')}.${suffix}`);
};
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('程序启动');
    const detectionManager = new detection_manager_1.DetectionManager(`${targetName}_${startTs.format('YYYY_MM_DD_HH_mm_ss')}.db`);
    yield detectionManager.init(config.processes);
    yield handleEndResponse();
    const data = yield detectionManager.stop();
    const _performanceData = (0, calc_utils_1.parsePerformance)((0, lodash_1.sortBy)(data, (it) => it.SystemTimeStamp));
    const realStartTime = (0, lodash_1.first)(_performanceData).ts;
    const realEndTime = (0, lodash_1.last)(_performanceData).ts;
    const performanceData = _performanceData.filter(it => {
        var _a, _b;
        return (it.ts >= ((_a = config.after) !== null && _a !== void 0 ? _a : 0) + realStartTime) &&
            (it.ts <= realEndTime - ((_b = config.before) !== null && _b !== void 0 ? _b : 0));
    });
    const htmlFilename = genDataFilename(startTs, 'html');
    yield (0, gen_echarts_html_1.genMultiEchartsHtml)(performanceData, htmlFilename, genDataFilename(startTs, ''));
    const text = (0, calc_utils_1.genText)(targetName, performanceData);
    yield fs_1.default.promises.writeFile(genDataFilename(startTs, 'txt'), text, {
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
