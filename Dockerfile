FROM ubuntu:latest

VOLUME /srv
WORKDIR /srv

ENV BUNDLE_PATH /srv/.bundle/

RUN apt-get update && \
    apt-get install -y \
    build-essential \
    git \
    ruby \
    ruby-dev \
    libxml2-dev \
    zlib1g-dev && \
    apt-get autoclean && \
    gem install bundler

ENTRYPOINT ["bundle"]
