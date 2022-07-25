module.exports = `
enum MaritalStatusEnum {
  MARRIED,
  SINGLE,
  WIDOWED,
  DIVORCED,
  NOT_SAYING
}

enum BankOperationsEnum {
  LOGIN,
  EVALUATION
}

enum VCTypeEnum {
  dateOfBirth
  relationshipStatus
  dependants
  education
  employmentStatus
  highestEducationAttained
  hasKYC
  bankVCs
  citizenship
  avgMonthlyIncome
  avgMonthlyRest
  savingPercent
}

type BankMessage {
  bankId: String!,
  operation: BankOperationsEnum!,
  success: Boolean!,
  payload: String,
  error: [String],
}

type Status {
  success: Boolean!
}

type RootQuery {
  bankVC(did: String, message: String, type: VCTypeEnum, parameters: String): [String]
}

type RootMutation {
  requestVerification(did: String, type: VCTypeEnum, username: String): String
  verifyVCs(did: String, vps: [String], pondAddress: String): Boolean
}

type Subscription {
  bank: BankMessage!,
  user: String!
}

schema {
  query: RootQuery,
  subscription: Subscription,
  mutation: RootMutation
}
`