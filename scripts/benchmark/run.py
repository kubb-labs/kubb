# usage: run.py <cwd> <cmd...>; prints "<wall ms> <peak RSS MB> <exit code>". Set VERBOSE=1 to keep the output.
import os, sys, time
cwd, cmd = sys.argv[1], sys.argv[2:]
t = time.perf_counter()
pid = os.fork()
if pid == 0:
    os.chdir(cwd)
    fd = os.open(os.devnull, os.O_WRONLY) if not os.environ.get('VERBOSE') else None
    if fd is not None: os.dup2(fd, 1); os.dup2(fd, 2)
    os.execvp(cmd[0], cmd)
_, status, ru = os.wait4(pid, 0)
print(round((time.perf_counter() - t) * 1000), round(ru.ru_maxrss / 1024), os.waitstatus_to_exitcode(status))
