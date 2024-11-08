import os

server_host = '100.84.135.9:8080'
api_file_upload = "http://" + server_host + '/File/upload'


def get_project_root():
    # 获取根目录 不受运行目录影响
    current_dir = os.path.abspath(__file__)
    while not os.path.exists(os.path.join(current_dir, '.project_root')):
        current_dir = os.path.dirname(current_dir)
    return current_dir
