"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genText = exports.parsePerformance = void 0;
const lodash_1 = require("lodash");
const utils_1 = require("./utils");
const getExeName = (exe, pid) => {
    var _a;
    return ((_a = (0, lodash_1.first)(exe.split('.exe'))) !== null && _a !== void 0 ? _a : '').split(' ').filter(Boolean).join('_') + '???' + pid;
    // return (first(exe.split('.exe')) ?? '').split(' ').filter(Boolean).join('_')
};
const updateArrayProperty = (obj, pathname, _data) => {
    const prev = (0, lodash_1.get)(obj, pathname);
    const data = isNaN(_data) ? 0 : _data;
    if ((0, lodash_1.isNil)(prev)) {
        (0, lodash_1.set)(obj, pathname, [data]);
    }
    else {
        (0, lodash_1.set)(obj, pathname, prev.concat(data));
    }
};
const updateNumberProperty = (obj, pathname, data) => {
    var _a;
    const prev = (_a = (0, lodash_1.get)(obj, pathname)) !== null && _a !== void 0 ? _a : 0;
    (0, lodash_1.set)(obj, pathname, prev + data);
};
const parsePerformance = (perfData, fpsData, coHostFpsData) => {
    const perf = perfData.map((perf) => {
        const total = {};
        const data = {};
        if (Array.isArray(perf.ProcessInfoList)) {
            perf.ProcessInfoList.forEach(it => {
                const procName = getExeName(it.ProcessName, it.ProcessId);
                it.GPUInfo.forEach(gpu => {
                    const adapterName = gpu.AdapterName.split(' ').filter(Boolean).join('_');
                    gpu.AdapterEngine.forEach(engine => {
                        const usage = Number(engine.Usage);
                        if (engine.NodeName === '3D') {
                            updateArrayProperty(data, `${procName}_${adapterName}.gpu_3d`, usage);
                            updateNumberProperty(total, `${adapterName}##total_gpu_3d`, usage);
                        }
                        if (engine.NodeName.startsWith('Video Decode')) {
                            updateArrayProperty(data, `${procName}_${adapterName}.gpu_video_decode`, usage);
                            updateNumberProperty(total, `${adapterName}##total_gpu_video_decode`, usage);
                        }
                        if (engine.NodeName.startsWith('Video Encode')) {
                            updateArrayProperty(data, `${procName}_${adapterName}.gpu_video_encode`, usage);
                            updateNumberProperty(total, `${adapterName}##total_gpu_video_encode`, usage);
                        }
                        if (engine.NodeName.startsWith('Video Codec')) {
                            updateArrayProperty(data, `${procName}_${adapterName}.gpu_video_codec`, usage);
                            updateNumberProperty(total, `${adapterName}##total_gpu_video_codec`, usage);
                        }
                        if (engine.NodeName === 'High Priority 3D') {
                            updateArrayProperty(data, `${procName}_${adapterName}.gpu_high_priority_3d`, usage);
                            updateNumberProperty(total, `${adapterName}##total_gpu_high_priority_3d`, usage);
                        }
                        if (engine.NodeName === 'Graphics_1') {
                            updateArrayProperty(data, `${procName}_${adapterName}.gpu_graphics`, usage);
                            updateNumberProperty(total, `${adapterName}##total_gpu_graphics`, usage);
                        }
                    });
                });
                updateArrayProperty(data, `${procName}.cpu`, Number(it.CpuUsage));
                updateArrayProperty(data, `${procName}.memory`, Number(it.MemoryInfo.WorkingSetPrivate));
                updateArrayProperty(data, `${procName}.io_read`, Number(it.IOInfo.ReadTransferCount));
                updateArrayProperty(data, `${procName}.io_write`, Number(it.IOInfo.WriteTransferCount));
                updateNumberProperty(total, 'total_cpu', Number(it.CpuUsage));
                updateNumberProperty(total, 'total_memory', Number(it.MemoryInfo.WorkingSetPrivate));
                updateNumberProperty(total, 'total_io_read', Number(it.IOInfo.ReadTransferCount));
                updateNumberProperty(total, 'total_io_write', Number(it.IOInfo.WriteTransferCount));
            });
        }
        const sys = {};
        perf.SystemGPUUsage.forEach(gpu => {
            const adapterName = gpu.AdapterName.split(' ').filter(Boolean).join('_');
            gpu.AdapterEngine.forEach(engine => {
                const usage = Number(engine.Usage);
                if (engine.NodeName === '3D') {
                    updateNumberProperty(sys, `${adapterName}##sys_gpu_3d`, usage);
                }
                if (engine.NodeName.startsWith('Video Decode')) {
                    updateNumberProperty(sys, `${adapterName}##sys_gpu_video_decode`, usage);
                }
                if (engine.NodeName.startsWith('Video Codec')) {
                    updateNumberProperty(sys, `${adapterName}##sys_gpu_video_codec`, usage);
                }
                if (engine.NodeName.startsWith('Video Encode')) {
                    updateNumberProperty(sys, `${adapterName}##sys_gpu_video_encode`, usage);
                }
                if (engine.NodeName === 'High Priority 3D') {
                    updateNumberProperty(sys, `${adapterName}##sys_gpu_high_priority_3d`, usage);
                }
                if (engine.NodeName === 'Graphics_1') {
                    updateNumberProperty(sys, `${adapterName}##sys_gpu_graphics`, usage);
                }
            });
            updateNumberProperty(sys, `${adapterName}##sys_gpu_usage_from_driver`, Number(gpu.GPUUsageFromDriver));
        });
        return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (0, utils_1.getKeys)(data).reduce((prev, procName) => (Object.assign(Object.assign({}, prev), (0, utils_1.getKeys)(data[procName]).reduce((_prev, _cur) => {
            const ret = (0, lodash_1.sum)(data[procName][_cur]);
            return Object.assign(Object.assign({}, _prev), { [`${procName}@@${_cur}`]: isNaN(ret) ? 0 : ret });
        }, {}))), {})), total), { sys_cpu_base_freq: Number(perf.CPUBaseFreq), sys_cpu_cur_freq: Number(perf.CPUCurrentFreq), sys_cpu: Number(perf.SystemCPUUsage) }), sys), { sys_memory: Number(perf.SystemMemory.TotalPhys) -
                Number(perf.SystemMemory.AvailPhys), ts: Math.floor(Number(perf.SystemTimeStamp) / 1000 / 1000 / 1000) });
    });
    if (fpsData && fpsData.length > 0) {
        const fpsTs = fpsData.map(op => op.ts);
        const perfTs = perf.map(op => op.ts);
        perfTs.forEach((op, idx) => {
            const fpsIdx = fpsTs.findIndex(it => it === op);
            const curPerf = perf[idx];
            if (fpsIdx >= 0) {
                const curFps = fpsData[fpsIdx];
                perf[idx] = Object.assign(Object.assign({}, curPerf), { render_fps: curFps.render_fps, encoder_fps: curFps.encoder_fps, send_fps: curFps.send_fps, encoder_fps_1: curFps.encoder_fps_1, send_fps_1: curFps.send_fps_1, camera_fps: curFps.camera_fps, camera_before_effect_fps: curFps.camera_before_effect_fps, camera_after_effect_fps: curFps.camera_after_effect_fps, camera_render_duration: curFps.camera_render_duration, camera_effect_duration: curFps.camera_effect_duration, preprocess_duration: curFps.preprocess_duration, camera_effect_algo_duration: curFps.camera_effect_algo_duration, camera_effect_render_duration: curFps.camera_effect_render_duration, camera_effect_env_duration: curFps.camera_effect_env_duration, latency: curFps.latency, ui_non_stuttering_duration: curFps.ui_non_stuttering_duration, setting_bitrate: curFps.setting_bitrate, setting_bitrate_1: curFps.setting_bitrate_1, meta_video_bitrate: curFps.meta_video_bitrate, meta_video_bitrate_1: curFps.meta_video_bitrate_1, real_push_bitrate: curFps.real_push_bitrate, real_push_bitrate_1: curFps.real_push_bitrate_1, ui_fps_achieving_rate: curFps.ui_fps_achieving_rate });
            }
            else {
                perf[idx] = Object.assign(Object.assign({}, curPerf), { render_fps: 0, encoder_fps: 0, send_fps: 0, encoder_fps_1: 0, send_fps_1: 0, camera_fps: 0, camera_before_effect_fps: 0, camera_after_effect_fps: 0, camera_render_duration: 0, camera_effect_duration: 0, preprocess_duration: 0, camera_effect_algo_duration: 0, camera_effect_render_duration: 0, camera_effect_env_duration: 0, latency: 0, ui_non_stuttering_duration: 0, setting_bitrate: 0, setting_bitrate_1: 0, meta_video_bitrate: 0, meta_video_bitrate_1: 0, real_push_bitrate: 0, real_push_bitrate_1: 0, ui_fps_achieving_rate: 0 });
            }
        });
    }
    if (coHostFpsData && coHostFpsData.length > 0) {
        const fpsTs = coHostFpsData.map(op => op.ts);
        const perfTs = perf.map(op => op.ts);
        perfTs.forEach((op, idx) => {
            const fpsIdx = fpsTs.findIndex(it => it === op);
            const curPerf = perf[idx];
            if (fpsIdx >= 0) {
                const curFps = (0, lodash_1.omit)(coHostFpsData[fpsIdx], 'ts');
                perf[idx] = Object.assign(Object.assign({}, curPerf), curFps);
            }
            else {
                perf[idx] = curPerf;
            }
        });
    }
    return perf;
};
exports.parsePerformance = parsePerformance;
const showGpuData = (obj, key) => {
    return (0, utils_1.getKeys)(obj).filter(it => it.split('##')[1] === key).map(it => {
        return [it.split('##')[0], obj[it]];
    });
};
const genText = (targetName, performanceData) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
    const len = performanceData.length;
    const lowFreqRate = performanceData.filter(perf => perf.sys_cpu_cur_freq < perf.sys_cpu_base_freq * 0.999).length / len;
    const _performanceData = performanceData.map((cur) => {
        const temp = {};
        (0, utils_1.getKeys)(cur).forEach((_cur) => {
            var _a, _b;
            if (_cur === 'ts') {
                return;
            }
            const exe = _cur.replace(/\?\?\?\d+/, '');
            temp[`${exe}_sum`] = ((_a = temp[`${exe}_sum`]) !== null && _a !== void 0 ? _a : 0) + ((_b = cur[_cur]) !== null && _b !== void 0 ? _b : 0);
        });
        return temp;
    });
    const ret = _performanceData.reduce((prev, cur) => {
        const temp = Object.assign({}, prev);
        (0, utils_1.getKeys)(cur).forEach((key) => {
            var _a;
            temp[key] = ((_a = temp[key]) !== null && _a !== void 0 ? _a : 0) + cur[key];
        });
        return temp;
    }, {});
    const avgPerformanceData = (0, utils_1.getKeys)(ret).reduce((prev, cur) => {
        return Object.assign(Object.assign({}, prev), { [cur.replace('_sum', '_avg')]: (0, utils_1.toFixed)(ret[cur] / len, 5) });
    }, {});
    return (`
================================================================================
软件：${targetName}
本次测试结果如下：

系统全局：
-------------------------
CPU占用: ${(0, utils_1.toFixed)(avgPerformanceData.sys_cpu_avg)}%
GPU 3D 占用: \n${showGpuData(avgPerformanceData, 'sys_gpu_3d_avg')
        .map(op => `  ${op[0]}: ${op[1]}%`).join('\n')}
GPU High Priority 3D 占用: \n${showGpuData(avgPerformanceData, 'sys_gpu_high_priority_3d_avg')
        .map(op => `  ${op[0]}: ${op[1]}%`).join('\n')}
GPU Video Encode 占用：\n${showGpuData(avgPerformanceData, 'sys_gpu_video_encode_avg')
        .map(op => `  ${op[0]}: ${op[1]}%`).join('\n')}
GPU Video Codec 占用：\n${showGpuData(avgPerformanceData, 'sys_gpu_video_codec_avg')
        .map(op => `  ${op[0]}: ${op[1]}%`).join('\n')}
GPU Video Decode 占用： \n${showGpuData(avgPerformanceData, 'sys_gpu_video_decode_avg')
        .map(op => `  ${op[0]}: ${op[1]}%`).join('\n')}
GPU Graphics 占用：\n${showGpuData(avgPerformanceData, 'sys_gpu_graphics_avg')
        .map(op => `  ${op[0]}: ${op[1]}%`).join('\n')}
GPU 占用率（驱动）：\n${showGpuData(avgPerformanceData, 'sys_gpu_usage_from_driver_avg')
        .map(op => `  ${op[0]}: ${op[1]}%`).join('\n')}
内存占用： ${(0, utils_1.formatBytes)((_a = avgPerformanceData.sys_memory_avg) !== null && _a !== void 0 ? _a : 0, 'MB')}MB
CPU 降频时间比例：${lowFreqRate * 100}%

${targetName}:
-------------------------
CPU占用: ${(0, utils_1.toFixed)((_b = avgPerformanceData.total_cpu_avg) !== null && _b !== void 0 ? _b : 0)}%
GPU 3D 占用: \n${showGpuData(avgPerformanceData, 'total_gpu_3d_avg')
        .map(op => `  ${op[0]}: ${op[1]}%`).join('\n')}
GPU High Priority 3D 占用: \n${showGpuData(avgPerformanceData, 'total_gpu_high_priority_3d_avg')
        .map(op => `  ${op[0]}: ${op[1]}%`).join('\n')}
GPU Video Encode 占用：\n${showGpuData(avgPerformanceData, 'total_gpu_video_encode_avg')
        .map(op => `  ${op[0]}: ${op[1]}%`).join('\n')}
GPU Video Codec 占用：\n${showGpuData(avgPerformanceData, 'total_gpu_video_codec_avg')
        .map(op => `  ${op[0]}: ${op[1]}%`).join('\n')}
GPU Video Decode 占用： \n${showGpuData(avgPerformanceData, 'total_gpu_video_decode_avg')
        .map(op => `  ${op[0]}: ${op[1]}%`).join('\n')}
GPU Graphics 占用：\n${showGpuData(avgPerformanceData, 'total_gpu_graphics_avg')
        .map(op => `  ${op[0]}: ${op[1]}%`).join('\n')}
内存占用： ${(0, utils_1.formatBytes)((_c = avgPerformanceData.total_memory_avg) !== null && _c !== void 0 ? _c : 0, 'MB')}MB
磁盘读出： ${(0, utils_1.formatBytes)((_d = avgPerformanceData.total_io_read_avg) !== null && _d !== void 0 ? _d : 0, 'MB')}MB/s
磁盘写入： ${(0, utils_1.formatBytes)((_e = avgPerformanceData.total_io_write_avg) !== null && _e !== void 0 ? _e : 0, 'MB')}MB/s

渲染帧率： ${(_f = avgPerformanceData.render_fps_avg) !== null && _f !== void 0 ? _f : 0}
主画布编码帧率： ${(_g = avgPerformanceData.encoder_fps_avg) !== null && _g !== void 0 ? _g : 0}
主画布推流帧率： ${(_h = avgPerformanceData.send_fps_avg) !== null && _h !== void 0 ? _h : 0}
从画布编码帧率： ${(_j = avgPerformanceData.encoder_fps_1_avg) !== null && _j !== void 0 ? _j : 0}
从画布推流帧率： ${(_k = avgPerformanceData.send_fps_1_avg) !== null && _k !== void 0 ? _k : 0}
相机渲染帧率：${(_l = avgPerformanceData.camera_fps_avg) !== null && _l !== void 0 ? _l : 0}
相机 effect 前帧率：${(_m = avgPerformanceData.camera_before_effect_fps_avg) !== null && _m !== void 0 ? _m : 0}
相机 effect 后帧率：${(_m = avgPerformanceData.camera_after_effect_fps_avg) !== null && _m !== void 0 ? _m : 0}
相机平均耗时: ${(_o = avgPerformanceData.camera_render_duration_avg) !== null && _o !== void 0 ? _o : 0}
相机平均 effect 耗时: ${(_p = avgPerformanceData.camera_effect_duration_avg) !== null && _p !== void 0 ? _p : 0}
相机平均前处理耗时: ${(_q = avgPerformanceData.preprocess_duration_avg) !== null && _q !== void 0 ? _q : 0}
相机平均 effect 算法阶段耗时: ${(_r = avgPerformanceData.camera_effect_algo_duration_avg) !== null && _r !== void 0 ? _r : 0}
相机平均 effect 渲染阶段耗时: ${(_s = avgPerformanceData.camera_effect_render_duration_avg) !== null && _s !== void 0 ? _s : 0}
相机平均 effect 环境转换耗时: ${(_t = avgPerformanceData.camera_effect_env_duration_avg) !== null && _t !== void 0 ? _t : 0}

平均 meta_video_bitrate: ${(_u = avgPerformanceData.meta_video_bitrate_avg) !== null && _u !== void 0 ? _u : 0}
平均 meta_video_bitrate_1: ${(_v = avgPerformanceData.meta_video_bitrate_1_avg) !== null && _v !== void 0 ? _v : 0}
平均 real_push_bitrate: ${(_w = avgPerformanceData.real_push_bitrate_avg) !== null && _w !== void 0 ? _w : 0}
平均 real_push_bitrate_1: ${(_x = avgPerformanceData.real_push_bitrate_1_avg) !== null && _x !== void 0 ? _x : 0}

平均 ui 帧率达成率：${(_y = avgPerformanceData.ui_fps_achieving_rate_avg) !== null && _y !== void 0 ? _y : 0}
平均 ui 未卡顿时长占比：${(_z = avgPerformanceData.ui_non_stuttering_duration_avg) !== null && _z !== void 0 ? _z : 0}

平均 latency:  ${(_0 = avgPerformanceData.latency_avg) !== null && _0 !== void 0 ? _0 : 0}

${Object.values((0, lodash_1.groupBy)((0, utils_1.getKeys)(avgPerformanceData)
        .filter(i => i.includes('@@')), (v) => v.split('@@')[1])).map(op => {
        const title = op[0].split('@@')[1];
        return `${title}\n------\n${op.map(it => {
            let ret = avgPerformanceData[it];
            if (title.startsWith('memory')) {
                ret = `${(0, utils_1.formatBytes)(ret !== null && ret !== void 0 ? ret : 0, 'MB')}MB`;
            }
            return `${it.split('@@')[0]}: ${ret}`;
        }).join('\n')}`;
    }).join('\n\n')}
================================================================================
    `);
};
exports.genText = genText;
