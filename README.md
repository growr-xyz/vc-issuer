# vc-issuer
Verifiable Credential Issuer, built using [RIdentity](https://www.rifos.org/identity) tools

Code is derived from [Bankathon backend](https://github.com/growr-xyz/growr-on-chain-backend).

## Setting up environment

create .env file

```
DB_HOST=mongodb
DB_PORT=27017
BANK_APP_KEY=<customer key for banco hipotecario sandbox>
PRIVATE_KEY=<random 32 bytes>
```

**DB_HOST** should be `mongodb` if running in docker environment, or `localhost` if the Isser runs as local service

## Installation

1. Clone this repo
`$ git clone git@github.com:https://github.com/growr-xyz/vc-issuer`, 
	then initialise the submodules by running:
`$ git submodule init` and `$ git submodule update`
1. Build docker image
`$ docker build --no-cache -t <docker-username>/<image-name>:<image-version> .`
3. Run docker-compose build script
`$ docker compose build`
4. Run docker-compose up script
`$ docker compose up -d`
5. Open GraphQL playground with browser at `http://localhost:4000`


## GraphQL

1. Request verification:

```graphql
mutation requestVC($did: String, $type: String, $subject: String) {
	requestVerification($did, $type, $subject)
}
```

### Types

Currently only atomic VC types are working:

  - [x] dateOfBirth
  - [x] relationshipStatus
  - [ ] dependants
  - [x] education
  - [x] employmentStatus
  - [x] highestEducationAttained
  - [x] kycStatus
  - [ ] bankVCs
  - [ ] creditRating

response should look like:

```json
{
	"data": {
		"requestVerification": "ea2823bb684cd67e382149066dc4b7400acd3fdaa468c07ff6312b65d3c92fa6"
	}
}
```

Used to pass BH username.

The `receivedVerification` value should be signed by the did and used as `message` parameter in the next query.
Currently the `receivedVerification` value should be used to encrypt the password:

In next versions the code should be passed on another channel - email or sms.


```js
const CryptoJS = require('crypto-js')

const password = CryptoJS.AES.encrypt('X!c9a49d53', receivedVerification).toString();
```

both signed `message` and AES generated `password` should be used in the following graphQL query to request VC

1. Request VC

```graphql
    query bankVC($did: String, $message: String, $type: VCTypeEnum, $parameters: String) {
      bankVC(did:$did, message:$message, parameters: $parameters, type: $type)
    }
}

```

Response:

```json
{
    "data": {
        "bankVC": "eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSJdLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiRGF0ZU9mQmlydGgiXSwiY3JlZGVudGlhbFNjaGVtYSI6eyJpZCI6ImRpZDpldGhyOnJzazoweDZhMzAzNWVjMzEzN2JlZWI2Nzg5ZmZhOTA4OThjY2FkNWNkMDZmNzk7aWQ9MDkzZWNkOTgtNDJkMC00ZWZjLTg5NTAtZjhjYmYwZWFhZDM1O3ZlcnNpb249MS4wIiwidHlwZSI6Ikpzb25TY2hlbWFWYWxpZGF0b3IyMDE4In0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7ImRhdGVPZkJpcnRoIjoiMjAyMS0xMS0xNyJ9fSwic3ViIjoiZGlkIiwibmJmIjoxNjQ4MDI4MjAwLCJpc3MiOiJkaWQ6ZXRocjpyc2s6MHg3RkRiYjFDQjNDMmVEMzU3NEMwNTg2Nzk5Y0NCMTRCRjE3MkE5RjEyIn0._nmmp_xrpcIZbeGG0uDEMnwGYFnrPAxjrULXmexehCQ3SGYwTrPp0Z77yOpGu1sb2-pEhn9UPpIX-wZSUFiZYA"
    }
}
```

## Flow

Current flow

```mermaid
sequenceDiagram
	participant Wallet
	participant Peseta
	participant Issuer
	participant Data Vault
	participant BH as Banco Hipo

	Peseta ->> Wallet: sign in wallet
	Peseta ->> Issuer: Request VC
	note right of Peseta: see requestVC mutation
	Issuer ->> Peseta: Response: Salt
	Peseta ->> Issuer: Verify and get bank info
	note right of Peseta: { did, signed(salt), salted(password), type }
	Issuer ->> Issuer: Decode the signed salt
	alt: did doesn't match the salt signer
		Issuer ->> Peseta: Error
	else: did matches the salt signer
		Issuer ->> Issuer: decode salted password
		Issuer ->> BH: Login
		BH ->> Issuer: Get user data (credit score)
		Issuer ->> Issuer: Create and sign VC
		Issuer ->> Peseta: send VC
		Peseta ->> Data Vault: VC
	end
```
