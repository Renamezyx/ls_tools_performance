import sys
from scripts import collection, calc

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
        else:
            print("unknown")
    else:
        print("unknown")
