# usage: median.py results.tsv; prints the median time (ms) and peak memory (MB) per mode, spec, and tool
import collections
import statistics
import sys

runs = collections.defaultdict(list)
for line in open(sys.argv[1]):
    mode, spec, tool, result = line.rstrip('\n').split('\t')
    ms, mb, code = map(int, result.split())
    if code != 0:
        sys.exit(f'{tool} failed on {spec} ({mode}) with exit code {code}')
    runs[(mode, spec, tool)].append((ms, mb))

for (mode, spec, tool), values in runs.items():
    ms = round(statistics.median(v[0] for v in values))
    mb = round(statistics.median(v[1] for v in values))
    print(f'{mode}\t{spec}\t{tool}\t{ms} ms\t{mb} MB')
