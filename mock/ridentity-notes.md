### rIdentity issues

rIdentity not supporting breaking changes of core modules that are used and also unsupported libraries.

That might raise issues when trying to use it in prod environment, especialy when some audit and vulnerability checks are implemented.

Latest released uport agent, called DAF version is 7.0.0, which is not supported anymore by uport and all documentation is lacking. Currently uport is splitted to veramo (open source agent, ex. DAF 7.0.0) and serto - enterprise DID solution.

Express-did-auth, though is using even older major version of daf-selective-disclosure for example - 6.3.0

MVP Issuer is using old and not supported DAF libs as well:

	"daf-core": "^6.1.1",
    "daf-did-comm": "^6.1.1",
    "daf-did-jwt": "^6.1.1",
    "daf-ethr-did": "^6.1.1",
    "daf-libsodium": "^6.1.1",
    "daf-resolver": "^6.0.0",
    "daf-selective-disclosure": "^6.0.0",
    "daf-w3c": "^6.0.0",

Other spotted old libs with breaking changes:

1. did-resolver used: 2.1.2 - recent: 3.1.5 <- braking change is usage oriented 
2. did-jwt used: 4.7.0 - recent: 5.12.4 <- breaking change is spec related!
3. ethr-did-resolver used: 3.0.1 - recent 5.0.4 <- breaking changes:

	-   The return type is `DIDResolutionResult` which wraps a `DIDDocument`.
	-   No errors are thrown during DID resolution. Please check `result.didResolutionMetadata.error` instead.
	-   This DID core spec requirement will break for users expecting `publicKey`, `ethereumAddress`, `Secp256k1VerificationKey2018` entries in the DID document. They are replaced with `verificationMethod`, `blockchainAccountId` and `EcdsaSecp256k1VerificationKey2019` and `EcdsaSecp256k1RecoveryMethod2020` depending on the content.