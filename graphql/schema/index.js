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
  BANK_VC,
  FINHEALTH_VC
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
  bankVC(did: String, message: String, parameters: String): String
}

type RootMutation {
  requestVerification(did: String, type: VCTypeEnum, username: String): String
  connectBank(username: String!, password: String!, wallet: String!): Status!
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