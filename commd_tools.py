import os
import subprocess
import chardet
import psutil


def decode_output(output):
    res = ""
    if output:
        encoding = chardet.detect(output)['encoding']
        res = output.decode(encoding)
    return res


def execute_command(cmd, timeout=5):
    """执行系统命令并处理超时和中断"""
    process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    try:
        # 设置最大等待时间，命令完成即返回
        output, error = process.communicate(timeout=timeout)
        decoded_output = decode_output(output)

        print("命令输出:")
        print(decoded_output)

        if error:
            print("错误信息:")
            print(decode_output(error))  # 忽略错误字节

        return_code = process.returncode
        print("命令执行完毕，返回值:", return_code)
        return decoded_output, return_code

    except subprocess.TimeoutExpired:
        # 超时时直接结束进程
        print("命令超时，正在终止进程...")
        parent = psutil.Process(process.pid)
        for child in parent.children(recursive=True):  # 终止所有子进程
            child.terminate()
        parent.terminate()
        process.kill()
        return "超时结束", 10001
    except KeyboardInterrupt:
        print("用户终止了命令")
        parent = psutil.Process(process.pid)
        for child in parent.children(recursive=True):  # 终止所有子进程
            child.terminate()
        parent.terminate()
        process.kill()
        output, error = process.communicate()  # 获取输出和错误信息
        decoded_output = decode_output(output)

        print("用户终止了命令 -命令输出:")
        print(decoded_output)
        return "用户终止", 1


if __name__ == '__main__':
    msg, code = execute_command(cmd="dir")
    # print(msg)
