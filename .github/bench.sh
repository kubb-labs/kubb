#!/usr/bin/env bash
# requires hyperfine and Bun (canary)
# https://github.com/sharkdp/hyperfine

hyperfine -i --warmup 3 --runs 10 "bun run test:vitest" "bun run test:bun" "bun run test:jest"
