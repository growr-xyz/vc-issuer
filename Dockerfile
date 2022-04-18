FROM mhart/alpine-node:14
RUN apk update
RUN apk add git

RUN mkdir -p /home/app

WORKDIR /home/app

RUN git submodule init
RUN git submodule update

WORKDIR /home/app/vc-json-schemas-parser
RUN npm run build

WORKDIR /home/app

COPY graphql ./graphql
COPY model ./model
COPY mock ./mock
COPY bank-api ./bank-api
COPY vc-issuer ./vc-issuer
COPY vc-json-schemas ./vc-json-schemas
COPY vc-json-schemas-parser ./vc-json-schemas-parser
COPY vc-verifier ./vc-verifier
COPY risk-assesor ./risk-assesor
COPY index.js .
COPY package.json .
COPY package-lock.json .
# COPY .env .

RUN npm ci

EXPOSE 4000

ENTRYPOINT ["node", "index.js"]