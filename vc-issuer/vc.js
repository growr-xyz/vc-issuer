const createEmailCredentialPayload = (
  sub,
  emailAddress
) => ({
  issuanceDate: new Date(),
  sub,
  vc: {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    type: ["VerifiableCredential", "Email"],
    credentialSchema: {
      id: "did:ethr:rsk:0x8a32da624dd9fad8bf4f32d9456f374b60d9ad28;id=1eb2af6b-0dee-6090-cb55-0ed093f9b026;version=1.0",
      type: "JsonSchemaValidator2018",
    },
    credentialSubject: { emailAddress },
  },
});

const createPhoneNumberCredentialPayload = (
  sub,
  phoneNumber
) => ({
  issuanceDate: new Date(),
  sub,
  vc: {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    type: ["VerifiableCredential", "Phone"],
    credentialSchema: {
      id: "did:ethr:rsk:0x8a32da624dd9fad8bf4f32d9456f374b60d9ad28;id=41ab7167-d98a-4572-b8de-fcc32289728c;version=1.0",
      type: "JsonSchemaValidator2018",
    },
    credentialSubject: { phoneNumber },
  },
});

const createDoBCredentialPayload = (
  sub,
  dateOfBirth
) => ({
  issuanceDate: new Date(),
  sub,
  vc: {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    type: ["VerifiableCredential", "DateOfBirth"],
    credentialSchema: {
      id: "did:ethr:rsk:0x6a3035ec3137beeb6789ffa90898ccad5cd06f79;id=093ecd98-42d0-4efc-8950-f8cbf0eaad35;version=1.0",
      type: "JsonSchemaValidator2018",
    },
    credentialSubject: { dateOfBirth },
  },
});

module.exports = {
  createDoBCredentialPayload,
  createEmailCredentialPayload,
  createPhoneNumberCredentialPayload
}