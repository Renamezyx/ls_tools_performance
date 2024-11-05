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
exports.genMultiEchartsHtml = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const lodash_1 = require("lodash");
const utils_1 = require("./utils");
const fs_1 = __importDefault(require("fs"));
const genFormatter = (key) => {
    switch (key) {
        case 'cpu':
        case 'gpu_3d':
        case 'gpu_high_priority_3d':
        case 'gpu_video_encode':
        case 'gpu_video_decode':
        case 'gpu_video_codec':
        case 'gpu_graphics':
        case 'gpu_usage_from_driver':
            {
                return {
                    key,
                    text: `${key}【%】`,
                    formatter: (val) => {
                        return (0, utils_1.toFixed)(val);
                    }
                };
            }
        case 'memory':
            {
                return {
                    key,
                    text: `${key}【MB】`,
                    formatter: (val) => {
                        return (0, utils_1.formatBytes)(val, 'MB');
                    }
                };
            }
        case 'io_read':
        case 'io_write':
            {
                return {
                    key,
                    text: `${key}【MB/s】`,
                    formatter: (val) => {
                        return (0, utils_1.formatBytes)(val, 'MB');
                    }
                };
            }
        case 'cpu_freq':
            {
                return {
                    key,
                    text: key,
                    formatter: (val) => {
                        return (0, utils_1.toFixed)(val);
                    }
                };
            }
    }
};
const keys = [
    'cpu_freq',
    'cpu',
    'gpu_3d',
    'gpu_high_priority_3d',
    'gpu_video_encode',
    'gpu_video_decode',
    'gpu_video_codec',
    'gpu_graphics',
    'memory',
    'io_read',
    'io_write',
    'gpu_usage_from_driver'
];
const rateKeys = [
    'ui_fps_achieving_rate'
];
const fpsKeys = [
    'render_fps',
    'encoder_fps',
    'send_fps',
    'encoder_fps_1',
    'send_fps_1',
    'camera_fps',
    'camera_effect_fps',
    'latency'
];
const bitrateKeys = [
    'setting_bitrate',
    'setting_bitrate_1',
    'meta_video_bitrate',
    'meta_video_bitrate_1',
    'real_push_bitrate',
    'real_push_bitrate_1'
];
const cohostKeyLike = 'cohost_fps_';
const durationKeyLike = '_duration';
const keysTotal = keys.map(op => `total_${op}`);
const keysSys = keys.map(op => `sys_${op}`);
const titles = keys.map(genFormatter);
const genDBByKeys = (dbName, xAxisData, originalData, keys) => {
    const seriesData = {};
    originalData.forEach((it, idx) => {
        Object.keys(it).forEach(key => {
            if (key === 'ts') {
                return;
            }
            if (keys.includes(key)) {
                if (!seriesData[key]) {
                    seriesData[key] = {
                        name: key,
                        type: 'line',
                        data: new Array(idx).fill(0)
                    };
                }
                seriesData[key].data.push(it[key]);
            }
        });
        if (!seriesData.none) {
            seriesData.none = {
                name: 'none',
                type: 'line',
                data: []
            };
        }
        seriesData.none.data.push(0);
    });
    const legendData = (0, utils_1.getKeys)(seriesData);
    if (xAxisData.length === 0 || Object.keys(seriesData).length === 1) {
        return null;
    }
    return {
        key: dbName,
        text: dbName,
        legendData,
        xAxisData: xAxisData.map(ts => dayjs_1.default.unix(ts).format('YYYY-MM-DD HH:mm:ss')),
        seriesData: legendData.map(key => {
            return `{
          name: ${JSON.stringify(key)},
          type: 'line',
          data: [${seriesData[key].data.join(',')}],
        }`;
        }),
        originalSeriesData: seriesData
    };
};
const genMultiEchartsHtml = (originalData, htmlPathname, csvPathname) => __awaiter(void 0, void 0, void 0, function* () {
    const xAxisData = [];
    const perfDB = titles.map((op, titleIdx) => {
        const seriesData = {};
        originalData.forEach((it, idx) => {
            if (titleIdx === 0) {
                xAxisData.push(it.ts);
            }
            Object.keys(it).forEach(key => {
                if (key === 'ts') {
                    return;
                }
                if ((key === 'sys_cpu_base_freq' || key === 'sys_cpu_cur_freq') &&
                    op.key === 'cpu_freq') {
                    if (!seriesData[key]) {
                        seriesData[key] = {
                            name: key,
                            type: 'line',
                            data: []
                        };
                    }
                    seriesData[key].data.push(op.formatter(it[key]));
                    return;
                }
                if (key.endsWith(`sys_${op.key}`)) {
                    if (!seriesData[key]) {
                        seriesData[key] = {
                            name: key,
                            type: 'line',
                            data: []
                        };
                    }
                    seriesData[key].data.push(op.formatter(it[key]));
                }
                if ((0, lodash_1.last)(key.split('@@')) === op.key ||
                    key.endsWith(`total_${op.key}`)) {
                    if (!seriesData[key]) {
                        seriesData[key] = {
                            name: key,
                            type: 'line',
                            data: new Array(idx).fill(0)
                        };
                    }
                    seriesData[key].data.push(op.formatter(it[key]));
                }
            });
            const maxLen = (0, lodash_1.max)(Object.values(seriesData).map(it => it.data.length));
            Object.keys(seriesData).forEach(key => {
                const restLen = maxLen - seriesData[key].data.length;
                if (restLen > 0) {
                    seriesData[key].data = seriesData[key].data.concat(new Array(restLen).fill(0));
                }
            });
        });
        const legendData = (0, lodash_1.sortBy)((0, utils_1.getKeys)(seriesData), (v) => {
            if (keysSys.some(it => v.endsWith(it))) {
                return 0;
            }
            if (keysTotal.some(it => v.endsWith(it))) {
                return 1;
            }
            return 2;
        });
        return {
            key: op.key,
            text: op.text,
            legendData,
            xAxisData: xAxisData.map(ts => dayjs_1.default.unix(ts).format('YYYY-MM-DD HH:mm:ss')),
            seriesData: legendData.map(key => {
                return `{
          name: ${JSON.stringify(key)},
          type: 'line',
          data: [${seriesData[key].data.join(',')}],
        }`;
            }),
            originalSeriesData: seriesData
        };
    });
    const fpsDB = genDBByKeys('fps', xAxisData, originalData, fpsKeys);
    const bitrateDB = genDBByKeys('bitrate', xAxisData, originalData, bitrateKeys);
    const rateDB = genDBByKeys('rate', xAxisData, originalData, rateKeys);
    const coHostFps = (() => {
        const seriesData = {};
        originalData.forEach((it, idx) => {
            Object.keys(it).forEach(key => {
                if (key === 'ts') {
                    return;
                }
                if (key.startsWith(cohostKeyLike)) {
                    if (!seriesData[key]) {
                        seriesData[key] = {
                            name: key,
                            type: 'line',
                            data: new Array(idx).fill(0)
                        };
                    }
                    seriesData[key].data.push(it[key]);
                }
            });
            if (!seriesData.none) {
                seriesData.none = {
                    name: 'none',
                    type: 'line',
                    data: []
                };
            }
            seriesData.none.data.push(0);
        });
        const legendData = (0, utils_1.getKeys)(seriesData);
        if (xAxisData.length === 0 || Object.keys(seriesData).length === 1) {
            return null;
        }
        return {
            key: 'cohost-fps',
            text: 'cohost-fps',
            legendData,
            xAxisData: xAxisData.map(ts => dayjs_1.default.unix(ts).format('YYYY-MM-DD HH:mm:ss')),
            seriesData: legendData.map(key => {
                return `{
          name: ${JSON.stringify(key)},
          type: 'line',
          data: [${seriesData[key].data.join(',')}],
        }`;
            }),
            originalSeriesData: seriesData
        };
    })();
    const durationDB = (() => {
        const seriesData = {};
        originalData.forEach((it, idx) => {
            Object.keys(it).forEach(key => {
                if (key === 'ts') {
                    return;
                }
                if (key.endsWith(durationKeyLike)) {
                    if (!seriesData[key]) {
                        seriesData[key] = {
                            name: key,
                            type: 'line',
                            data: new Array(idx).fill(0)
                        };
                    }
                    seriesData[key].data.push(it[key]);
                }
            });
            if (!seriesData.none) {
                seriesData.none = {
                    name: 'none',
                    type: 'line',
                    data: []
                };
            }
            seriesData.none.data.push(0);
        });
        const legendData = (0, utils_1.getKeys)(seriesData);
        if (xAxisData.length === 0 || Object.keys(seriesData).length === 1) {
            return null;
        }
        return {
            key: 'duration',
            text: 'duration【微秒】',
            legendData,
            xAxisData: xAxisData.map(ts => dayjs_1.default.unix(ts).format('YYYY-MM-DD HH:mm:ss')),
            seriesData: legendData.map(key => {
                return `{
          name: ${JSON.stringify(key)},
          type: 'line',
          data: [${seriesData[key].data.join(',')}],
        }`;
            }),
            originalSeriesData: seriesData
        };
    })();
    const db = [...perfDB, fpsDB, bitrateDB, rateDB, coHostFps, durationDB].filter(Boolean);
    const html = genEchartsHTMLString(db);
    yield fs_1.default.promises.writeFile(htmlPathname, html, 'utf-8');
    return Promise.all(db.map((data) => __awaiter(void 0, void 0, void 0, function* () {
        const records = [];
        data.legendData.forEach((_, idx) => {
            const temp = {};
            Object.values(data.originalSeriesData).forEach((d) => {
                temp[d.name] = d.data[idx];
            });
            records.push(temp);
        });
        yield (0, utils_1.writeToCSV)(records, `${csvPathname}-${data.key}.csv`);
    })));
});
exports.genMultiEchartsHtml = genMultiEchartsHtml;
const genEchartsHTMLString = (data) => {
    const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>live performance</title>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.3.2/dist/echarts.min.js"></script>
    <style>
      html,
      body {
        height: 100%;
      }
    </style>
  </head>
  <body>
    ${data
        .map(({ text }, idx) => {
        return `<div style="margin: 32px">------------------------------------------【 ${text !== null && text !== void 0 ? text : ''} 】------------------------------------------</div><div id="root-${idx}" style="width: 100%; height: 50%"></div>`;
    })
        .join('')}
    <script>
      ${data
        .map((op, idx) => {
        const { legendData, xAxisData, seriesData } = op;
        return `const chart${idx} = echarts.init(document.getElementById('root-${idx}'));
          const option${idx} = {
            tooltip: {
              trigger: 'axis',
              axisPointer: { type: 'cross' }
            },
            legend: {
              data: [${legendData.map(it => JSON.stringify(it)).join(',')}],
              orient: 'vertical',
              type: 'scroll',
              left: 0,
            },
            grid: {
              left: '30%',
              containLabel: true,
            },
            toolbox: {
              feature: {
                saveAsImage: {},
              },
            },
            xAxis: {
              type: 'category',
              // boundaryGap: false,
              data: [${xAxisData.map(it => JSON.stringify(it)).join(',')}],
            },
            yAxis: {
              type: 'value',
            },
            series: [${seriesData.join(',')}],
            dataZoom: [
              {
                type: 'slider',
                start: 0,
                end: 100,
              },
            ],
          };
          chart${idx}.setOption(option${idx});`;
    })
        .join('\n')}
    </script>
  </body>
</html>
  `;
    return html;
};
