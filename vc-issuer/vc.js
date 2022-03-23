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

const createBHCreditScoreCredentialPayload = (
  sub,
  BHCredcreditScore
) => ({
  issuanceDate: new Date(),
  sub,
  vc: {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    type: ["VerifiableCredential", "BHCreditScore"],
    credentialSchema: {
      id: "did:ethr:rsk:0x6a3035ec3137beeb6789ffa90898ccad5cd06f79;id=a2ef76b3-6d0e-4c75-a0f3-d45832554150;version=1.0",
      type: "JsonSchemaValidator2018",
    },
    credentialSubject: { BHCredcreditScore },
  },
});

const createDependantsCredentialPayload = (
  sub,
  Dependants
) => ({
  issuanceDate: new Date(),
  sub,
  vc: {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    type: ["VerifiableCredential", "Dependants"],
    credentialSchema: {
      id: "did:ethr:rsk:0x6a3035ec3137beeb6789ffa90898ccad5cd06f79;id=0c9750ae-0327-4dce-af60-c9ccceb31791;version=1.0",
      type: "JsonSchemaValidator2018",
    },
    credentialSubject: { Dependants },
  },
});

const createEmploymentStatusCredentialPayload = (
  sub,
  EmploymentStatus
) => ({
  issuanceDate: new Date(),
  sub,
  vc: {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    type: ["VerifiableCredential", "EmploymentStatus"],
    credentialSchema: {
      id: "did:ethr:rsk:0x6a3035ec3137beeb6789ffa90898ccad5cd06f79;id=854b49b2-c9d3-4069-adcf-098dec040f87;version=1.0",
      type: "JsonSchemaValidator2018",
    },
    credentialSubject: { EmploymentStatus },
  },
});

const createHighestEducationAttainedCredentialPayload = (
  sub,
  HighestEducationAttained
) => ({
  issuanceDate: new Date(),
  sub,
  vc: {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    type: ["VerifiableCredential", "HighestEducationAttained"],
    credentialSchema: {
      id: "did:ethr:rsk:0x6a3035ec3137beeb6789ffa90898ccad5cd06f79;id=bcde0260-c115-4075-90bc-84fdf5807f28;version=1.0",
      type: "JsonSchemaValidator2018",
    },
    credentialSubject: { HighestEducationAttained },
  },
});

const createKYCStatusCredentialPayload = (
  sub,
  KYCStatus
) => ({
  issuanceDate: new Date(),
  sub,
  vc: {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    type: ["VerifiableCredential", "KYCStatus"],
    credentialSchema: {
      id: "did:ethr:rsk:0x6a3035ec3137beeb6789ffa90898ccad5cd06f79;id=dbc19b34-e4c8-451b-9607-b56fbed6e1cb;version=1.0",
      type: "JsonSchemaValidator2018",
    },
    credentialSubject: { KYCStatus },
  },
});


const createRelationshipStatusCredentialPayload = (
  sub,
  RelationshipStatus
) => ({
  issuanceDate: new Date(),
  sub,
  vc: {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    type: ["VerifiableCredential", "RelationshipStatus"],
    credentialSchema: {
      id: "did:ethr:rsk:0x6a3035ec3137beeb6789ffa90898ccad5cd06f79;id=f0c50627-36cc-43e8-bc22-95506fde7ff2;version=1.0",
      type: "JsonSchemaValidator2018",
    },
    credentialSubject: { RelationshipStatus },
  },
});


module.exports = {
  createDoBCredentialPayload,
  createEmailCredentialPayload,
  createPhoneNumberCredentialPayload,
  createBHCreditScoreCredentialPayload,
  createDependantsCredentialPayload,
  createEmploymentStatusCredentialPayload,
  createHighestEducationAttainedCredentialPayload,
  createKYCStatusCredentialPayload,
  createRelationshipStatusCredentialPayload
}