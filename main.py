import os
import signal
import subprocess
import sys

def main():
    root = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root, "back-end")
    frontend_dir = os.path.join(root, "front-end")

    if not os.path.isdir(backend_dir) or not os.path.isdir(frontend_dir):
        print("錯誤：請在專案根目錄執行 run.py", file=sys.stderr)
        sys.exit(1)

    backend_cmd = [sys.executable, "api.py"]
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=backend_dir,
        stdout=sys.stdout,
        stderr=sys.stderr,
    )

    frontend_proc = subprocess.Popen(
        "npm run dev",
        shell=True,
        cwd=frontend_dir,
        stdout=sys.stdout,
        stderr=sys.stderr,
    )

    def kill_both(*_):
        backend_proc.terminate()
        frontend_proc.terminate()
        backend_proc.wait()
        frontend_proc.wait()
        sys.exit(0)

    signal.signal(signal.SIGINT, kill_both)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, kill_both)

    backend_proc.wait()
    frontend_proc.wait()

if __name__ == "__main__":
    main()
