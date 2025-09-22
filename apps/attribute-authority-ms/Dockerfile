FROM node:20.17.0-alpine@sha256:bf77dc26e48ea95fca9d1aceb5acfa69d2e546b765ec2abfb502975f1a2d4def as builder

WORKDIR /usr/src/app

COPY /src /usr/src/app/src
COPY /package.json /usr/src/app/package.json
COPY /tsconfig.json /usr/src/app/tsconfig.json
COPY /openapi /usr/src/app/openapi

RUN chmod -R 777 /usr/src/app \
  && yarn install \
  && yarn build

FROM node:20.17.0-alpine@sha256:bf77dc26e48ea95fca9d1aceb5acfa69d2e546b765ec2abfb502975f1a2d4def
LABEL maintainer="https://pagopa.gov.it"

WORKDIR /usr/src/app

COPY /package.json /usr/src/app/package.json
COPY --from=builder /usr/src/app/dist /usr/src/app/dist
COPY --from=builder /usr/src/app/node_modules /usr/src/app/node_modules
COPY --from=builder /usr/src/app/openapi /usr/src/app/openapi

EXPOSE 3000

CMD ["yarn", "start"]