FROM mhart/alpine-node:14

RUN mkdir -p /home/app

WORKDIR /home/app

COPY graphql ./graphql
COPY model ./model
COPY bank-api ./bank-api
COPY web3-api ./web3-api
COPY vc-issuer ./vc-issuer
COPY index.js .
COPY package.json .
COPY .env .

RUN npm install

EXPOSE 4000

ENTRYPOINT ["node", "index.js"]