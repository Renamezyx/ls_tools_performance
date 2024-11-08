import os.path
import sys
from scripts import collection, calc
from utils import send_data, get_latest_file
from config import get_project_root

if __name__ == '__main__':
    if len(sys.argv) > 1:
        param_1 = sys.argv[1]
        if param_1.lower() == "livestudio":
            print("开启采集...")
            param_2 = sys.argv[2]
            collection("liveStudio", int(param_2))
        elif param_1.lower() == "calc":
            print("开启生成...")
            param_2 = sys.argv[2]
            calc(param_2)
        elif param_1.lower() == "send":
            path = get_latest_file(directory=os.path.join(get_project_root()), extension=".zip")
            print(f"正在上传...{path}")
            send_data(path)
        else:
            print("unknown")
    else:
        print("unknown")
