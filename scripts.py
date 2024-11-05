import os

from commd_tools import get_project_root, execute_command
from utils import move_must_files, zip_subdirectories, send_data, delete_files_in_directory


def collection(app_name, t):
    """
    run collection command on app_name
    :return:
    """
    command = "cd {0} && node index.js {1} {2}".format(
        os.path.join(get_project_root(), "live_studio_performance"),
        app_name,
        t)
    execute_command(command, t)


def calc(zip_name):
    command = "cd {0} && node calc".format(os.path.join(get_project_root(), "live_studio_performance"))
    move_must_files()
    execute_command(command)
    # 打压缩包
    zip_path = zip_subdirectories(os.path.join(get_project_root(), "live_studio_performance", "original-data"), zip_name)
    # 发送
    code = send_data(zip_path)
    if code == 200:
        # 删除original-data目录下源文件
        print("-- 上传完成，删除original-data目录下源文件")
        delete_files_in_directory(os.path.join(get_project_root(), "live_studio_performance", "original-data"))
    else:
        print("Error code: {0}".format(code))

