FROM mcr.microsoft.com/devcontainers/base:debian@sha256:da67c59f82e057e0ccb81ec7d13fb50464c26f477638018e6de1b2623a008a3a

USER root

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY certs/ /tmp/devcontainer-certs/

RUN set -eux; \
    install -d /usr/local/share/ca-certificates/devcontainer-host; \
    find /tmp/devcontainer-certs -maxdepth 1 -type f -name '*.crt' -exec cp {} /usr/local/share/ca-certificates/devcontainer-host/ \; ; \
    if find /usr/local/share/ca-certificates/devcontainer-host -maxdepth 1 -type f -name '*.crt' | grep -q .; then \
        update-ca-certificates; \
    else \
        echo 'No additional host CA certificates were provided.'; \
    fi; \
    rm -rf /tmp/devcontainer-certs

ENV CURL_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt \
    NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt \
    PIP_CERT=/etc/ssl/certs/ca-certificates.crt \
    REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt \
    SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt

USER vscode