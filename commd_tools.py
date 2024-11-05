import os
import subprocess
import time


def get_project_root():
    # 获取根目录 不受运行目录影响
    current_dir = os.path.abspath(__file__)
    while not os.path.exists(os.path.join(current_dir, '.project_root')):
        current_dir = os.path.dirname(current_dir)
    return current_dir


def execute_command(cmd, timeout=5):
    # 启动子进程执行命令
    process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    try:
        # 等待命令执行完成，最多等待timeout秒
        output, error = process.communicate(timeout=timeout)

        # 解码输出
        try:
            decoded_output = output.decode('utf-8')
        except UnicodeDecodeError:
            try:
                decoded_output = output.decode('gbk')
            except UnicodeDecodeError:
                print("无法解码输出，输出内容如下：")
                print(output)
                decoded_output = ""

        # 输出命令结果
        print("命令输出:")
        print(decoded_output)

        # 如果有错误信息，输出错误
        if error:
            print("错误信息:")
            print(error.decode())

        # 获取返回值
        return_code = process.returncode
        print("命令执行完毕，返回值:", return_code)

        return decoded_output, return_code

    except subprocess.TimeoutExpired:
        # 如果超时，则强制终止命令
        process.terminate()
        print("命令超时，已被强制结束")

        # 获取命令的输出和错误信息
        output, error = process.communicate()

        try:
            decoded_output = output.decode('utf-8')
        except UnicodeDecodeError:
            try:
                decoded_output = output.decode('gbk')
            except UnicodeDecodeError:
                print("无法解码输出，输出内容如下：")
                print(output)
                decoded_output = ""

        print("命令输出:")
        print(decoded_output)
        if error:
            print("错误信息:")
            print(error.decode())

        # 返回终止的返回码
        return_code = process.returncode
        print("命令执行完毕，返回值:", return_code)

        return decoded_output, return_code

    except KeyboardInterrupt:
        # 如果用户按下Ctrl+C
        print("用户终止了命令")
        process.terminate()
        output, error = process.communicate()
        return_code = process.returncode
        print("命令已被强制结束，返回值:", return_code)
        return "", return_code
