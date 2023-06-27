#!/usr/bin/env bash

npm --no-git-tag-version version minor || true

version=$(node -p "require('./package.json').version")
canary_date=$(date +'%Y%m%dT%H%M%S')
canary_version=$(echo $version'-canary.'$canary_date)

echo "Version that will be published: $canary_version"
npm --no-git-tag-version version $canary_version || true
