#!/usr/bin/env bash

CONTAINER_NAME="tsondt/blog"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
docker build -t "${CONTAINER_NAME}" "$DIR"