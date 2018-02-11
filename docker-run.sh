#!/bin/bash

docker run -ti --rm -v $PWD:/srv -p 4000:4000 "tsondt/blog" check ||
docker run -ti --rm -v $PWD:/srv -p 4000:4000 "tsondt/blog" install &&
docker run -ti --rm -v $PWD:/srv -p 4000:4000 "tsondt/blog" exec jekyll serve --host 0.0.0.0 --port 4000 $1
