FROM mhart/alpine-node:14

RUN mkdir -p /home/app

WORKDIR /home/app

COPY graphql ./graphql
COPY model ./model
COPY bank-api ./bank-api
COPY web3-api ./web3-api
COPY vc-issuer ./vc-issuer
COPY vc-json-schemas ./vc-json-schemas
COPY index.js .
COPY package.json .
COPY package-lock.json .
COPY .env .

RUN npm ci

EXPOSE 4000

ENTRYPOINT ["node", "index.js"]