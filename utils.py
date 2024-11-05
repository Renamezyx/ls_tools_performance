import glob
import os
import shutil
import subprocess
import zipfile

import requests

from commd_tools import get_project_root, execute_command
from config import api_file_upload


def get_latest_file(directory, extension="*"):
    """
    获取{directory}目录下最新的{extension}为后缀的文件路径
    """
    # 构建搜索路径
    search_path = os.path.join(directory, f"*.{extension}")

    # 获取指定目录下所有的文件
    files = glob.glob(search_path)

    # 如果没有找到文件，返回 None
    if not files:
        return None

    # 使用 max 函数找到最新的文件
    latest_file = max(files, key=os.path.getmtime)

    return latest_file


def get_latest_folder(directory):
    """
    获取{directory}目录下最新的目录
    """
    # Get all directories in the specified directory
    folders = [f for f in glob.glob(os.path.join(directory, '*')) if os.path.isdir(f)]

    # If no folders are found, return None
    if not folders:
        return None

    # Use the max function to find the latest folder
    latest_folder = max(folders, key=os.path.getmtime)

    return latest_folder


def move_must_files():
    """
    move files for liveStudio
    :return:
    """

    ls_fps_db_path = get_latest_file(os.path.join(os.getenv('APPDATA'), "TikTok LIVE Studio", "test-fps-data"))
    performance_path = get_latest_file(os.path.join(get_project_root(), "live_studio_performance", "data"))
    origin_path = os.path.join(get_project_root(), "live_studio_performance", "original-data")
    if os.path.exists(origin_path):
        shutil.rmtree(origin_path)
    os.mkdir(origin_path)
    shutil.move(ls_fps_db_path, os.path.join(origin_path, ls_fps_db_path.split(str(os.sep))[-1]))
    shutil.move(performance_path, os.path.join(origin_path, performance_path.split(str(os.sep))[-1]))


def zip_subdirectories(directory_path, zip_name):
    dir_path = get_latest_folder(directory_path)
    zip_filename = f"{zip_name}.zip"
    zip_file_path = os.path.join(directory_path, zip_filename)
    if os.path.exists(zip_file_path):
        os.remove(zip_file_path)
    with zipfile.ZipFile(zip_file_path, 'w') as zip_file:
        # 将子目录下的所有文件添加到压缩包中
        for root, dirs, files in os.walk(dir_path):
            for file in files:
                file_path = os.path.join(root, file)
                arc_name = os.path.relpath(file_path, dir_path)
                zip_file.write(file_path, arcname=arc_name)
    return zip_file_path


def delete_files_in_directory(directory):
    # 遍历指定目录下的所有文件
    for filename in os.listdir(directory):
        file_path = os.path.join(directory, filename)
        # 判断是否是文件，如果是文件则删除
        if os.path.isfile(file_path):
            os.remove(file_path)
            print(f"Deleted: {file_path}")


def get_device_id():
    cmd = "wmic csproduct get UUID"
    output, code = execute_command(cmd)
    if len(output.split("\n")) > 1 and code == 0:
        return output.split("\n")[:-1]
    return None


def send_data(path):
    with open(path, 'rb') as file:
        files = {'file': file}
        data = {'device_id': get_device_id()}
        res = requests.post(url=api_file_upload, data=data,
                            files=files, verify=False)
        return res.status_code


if __name__ == '__main__':
    get_device_id()
