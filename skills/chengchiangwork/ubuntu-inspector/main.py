# main.py
import psutil
import platform
import shutil
import socket
import datetime
import json
import sys

def run_inspection():
    # 获取数据
    cpu_percent = psutil.cpu_percent(interval=1)
    mem = psutil.virtual_memory()
    disk = shutil.disk_usage("/")
    
    # 简单的服务状态检查 (针对你常用的服务)
    services = ["ssh", "docker"] 
    service_status = {}
    # 注意：此操作通常需要 sudo 权限，如果是容器环境可能无效
    
    report = {
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "hostname": platform.node(),
        "os": platform.platform(),
        "cpu": f"{cpu_percent}%",
        "memory": f"{mem.percent}% (Used: {mem.used // (1024**2)}MB / Total: {mem.total // (1024**2)}MB)",
        "disk": f"{(disk.used/disk.total)*100:.1f}% used",
        "network": "Online" if check_connectivity() else "Offline"
    }
    return report

def check_connectivity():
    try:
        socket.create_connection(("8.8.8.8", 53), timeout=3)
        return True
    except:
        return False

if __name__ == "__main__":
    # OpenClaw 调用时通常会传入参数，这里简单返回 JSON 结果
    result = run_inspection()
    print(json.dumps(result, ensure_ascii=False))
