"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configs = void 0;
exports.configs = {
    livestudio: {
        name: 'live_studio',
        processes: [
            'TikTok LIVE Studio.exe',
            'MediaSDK_Server.exe',
            'parfait_crash_handler.exe',
            'browserpage.exe',
            'gpudetect.exe',
            'electron.exe',
            'Electron.exe'
        ],
        after: 0,
        before: 0
    },
    streamlabs: {
        name: 'streamlabs',
        processes: [
            'obs64.exe',
            'Streamlabs OBS.exe',
            'crash-handler-process.exe',
            'crashpad_handler.exe'
        ]
    },
    obs64: {
        name: 'obs64',
        processes: ['obs64.exe']
    },
    webcast: {
        name: 'webcast',
        processes: [
            '直播伴侣.exe',
            'MediaSDK_Server',
            'systeminfo.exe',
            'crashpad_handler.exe'
        ]
    }
};
