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
exports.DetectionManager = void 0;
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const ffi_napi_1 = __importDefault(require("ffi-napi"));
const nedb_1 = __importDefault(require("@seald-io/nedb"));
const utils_1 = require("./utils");
const nedb_logger_1 = require("./nedb-logger");
const arch = os_1.default.arch();
console.log('arch:', arch);
/**
 * 虽然 os.arch 在
 *  系统为 64 位，node 版本为 32 位的情况下，会返回 ia32，
 *  但这个时候 ffi-napi 加载 64 位的 dll 还是报错了，
 *  所以猜测是依赖 node 自身去编译 dll；
 * 因此用 os.arch 做判断就足够了
 */
const perfDetectionDllPathname = path_1.default.resolve(__dirname, `./perfmon/PerformanceDetection_${arch === 'ia32' ? 'x86' : 'x64'}.dll`);
/**
extern "C" __declspec(dllexport) bool __stdcall PerformanceDetection_Init();
extern "C" __declspec(dllexport) void __stdcall PerformanceDetection_Uninit();
extern "C" __declspec(dllexport) bool __stdcall PerformanceDetection_ProcessList_Add(const char* process_name);
extern "C" __declspec(dllexport) bool __stdcall PerformanceDetection_ProcessList_Remove(const char* process_name);
extern "C" __declspec(dllexport) void __stdcall PerformanceDetection_ProcessList_Clear();
extern "C" __declspec(dllexport) bool __stdcall PerformanceDetection_Start(PerformanceCollectCallback cb, uint64_t user_data);
extern "C" __declspec(dllexport) bool __stdcall PerformanceDetection_Stop(bool wait);
extern "C" __declspec(dllexport) bool __stdcall PerformanceDetection_IsStopped();
 */
class DetectionManager {
    constructor(filename) {
        this.asyncQueue = new utils_1.AutoQueue();
        this.instance = ffi_napi_1.default.Library(perfDetectionDllPathname, {
            PerformanceDetection_Init: ['bool', []],
            PerformanceDetection_Uninit: ['void', []],
            PerformanceDetection_ProcessList_Add: ['bool', ['string']],
            PerformanceDetection_ProcessList_Remove: ['bool', ['string']],
            PerformanceDetection_ProcessList_Clear: ['void', []],
            PerformanceDetection_Start: ['bool', [
                    ffi_napi_1.default.Function('void', ['string', 'int'])
                ]],
            PerformanceDetection_Stop: ['bool', ['bool']],
            PerformanceDetection_IsStopped: ['bool', []]
        });
        this.insertData = (v) => {
            this.asyncQueue.enqueue(() => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield this.db.insert(v);
                }
                catch (e) {
                    console.error('db insert fail. original data:', v, ';error:', e);
                }
            }));
        };
        this.callback = ffi_napi_1.default.Callback('void', ['string', 'int'], (str) => {
            const data = JSON.parse(str);
            this.insertData(data);
        });
        this._checkIsStop = (times = 3) => __awaiter(this, void 0, void 0, function* () {
            if (this.instance.PerformanceDetection_IsStopped()) {
                return true;
            }
            if (times <= 0) {
                return false;
            }
            yield (0, utils_1.sleep)(1000);
            return this._checkIsStop(times - 1);
        });
        this._stop = () => {
            this.instance.PerformanceDetection_Stop(false);
            return this._checkIsStop();
        };
        this.init = (procList) => __awaiter(this, void 0, void 0, function* () {
            procList.forEach(proc => {
                this.instance.PerformanceDetection_ProcessList_Add(proc);
            });
            this.instance.PerformanceDetection_Start(this.callback);
        });
        this.getData = (db, times = 3) => __awaiter(this, void 0, void 0, function* () {
            const data = db.getAllData();
            if (data.length === 0 && times > 0) {
                yield (0, utils_1.sleep)();
                return this.getData(db, times - 1);
            }
            return data;
        });
        this.stop = () => __awaiter(this, void 0, void 0, function* () {
            yield this._stop();
            const db = new nedb_1.default({
                filename: this.filename
            });
            yield db.loadDatabaseAsync();
            // 加载数据的时候是异步的，所以需要重试获取
            return this.getData(db);
        });
        this.destroy = () => {
            this.instance.PerformanceDetection_Uninit();
        };
        this.filename = path_1.default.resolve(process.cwd(), `./data/${filename}`);
        this.instance.PerformanceDetection_Init();
        this.db = new nedb_logger_1.Logger({
            filename: this.filename
        });
    }
}
exports.DetectionManager = DetectionManager;
