#!/usr/bin/env bash

CONTAINER_NAME="tsondt/blog"
CONTAINER_PORT=4000
ARGS="${CONTAINER_PORT} "$@"

usage () {
    echo "Usage:"
    echo "\t./docker-run.sh"
    echo "\t./docker-run.sh [port] [jekyll serve extra args]"
}

if ! [ $# -eq 0 ]; then
    re='^[0-9]+$'
    if ! [[ $1 =~ $re ]] ; then
        usage
        exit 1
    fi
    CONTAINER_PORT=$1
    ARGS="$@"
fi

docker run --rm -v $PWD:/srv "${CONTAINER_NAME}" check ||
docker run --rm -v $PWD:/srv "${CONTAINER_NAME}" install &&
docker run -ti --rm -v $PWD:/srv -p ${CONTAINER_PORT}:${CONTAINER_PORT} "${CONTAINER_NAME}" exec jekyll serve --host 0.0.0.0 --port ${ARGS}
