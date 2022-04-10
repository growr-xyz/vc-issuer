const axios = require('axios')
const { AgeFromDateString } = require('age-calculator');


const { pubsub } = require('../graphql/helper')

let instance

const FinastraConnection = () => {
  let userToken
  let userAccounts
  let userData = {}
  let error
  instance = {
    setToken: async (token) => {
      userToken = token
      return { success: !!userToken }
    },

    getConsumer: async () => {
      const config = {
        method: 'get',
        url: `https://api.fusionfabric.cloud/retail-us/me/v1/profile`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        }
      }
      let customers
      if (this.error === 504) {
        customers = require('../mock/bh_customer_data.js')
      } else {
        customers = (await (axios(config))).data
      }
      const user = {}

      console.log(`* customer :: ${customers}`)
      user.age = new AgeFromDateString(customers.dateOfBirth).age
      user.kycStatus = !!(customers.coreIdentifications[0].idType === 'Personal')
      user.citizenship = customers.addresses[0].addressType === 'physical' ? customers.addresses[0].state : 'none'
      this.userData = user
      return this.userData
    },

    getUserAccounts: async () => {
      const config = {
        method: 'get',
        url: `https://api.fusionfabric.cloud/retail-us/me/account/v1/accounts`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        }
      }
      const userAccountIds = (await axios(config)).data.map(a => a.accountId)
      this.userData.userAccountIds = userAccountIds
      return this.userData.userAccountIds
    },

    getUserAccount: async (accountId) => {
      const config = {
        method: 'get',
        url: `https://api.fusionfabric.cloud/retail-us/me/account/v1/accounts/${accountId}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        }
      }
      return (await axios(config)).data
    },

    getUserTransferHistory: async (accountId) => {
      const config = {
        method: 'get',
        url: `https://api.fusionfabric.cloud/retail-us/me/account/v1/accounts/${accountId}/transactions/`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        }
      }
      return (await axios(config)).data
    },

    getCredentialsForMainAccount: (transferHistory) => {
      this.userData = { ...this.userData, ...calculateAccountData(transferHistory) }
      return this.userData
    },

    getUserData: () => userData,
    setUserData: (newData) => {
      userData = newData
      return userData
    }

  }
  return instance
}

module.exports = FinastraConnection

/* 
2.1) Calculate:
 Total-Incoming = [SUM(transactionAmount) where debit = false]
 Total-Outgoing = [SUM(transactionAmount) where debit = true]
2.1) Issue a VC: "Average monthly income" = Total-Incoming / 6
2.2) Issue a VC: "Averate monthly rest" = (Total-Incoming - Total-Outgoing) / 6
2.3) Issue a VC: "Saving percent" = (Total-Incoming - Total-Outgoing) / Total-Incoming

*/

const calculateAccountData = (transactionHistory) => {
  let totalIncoming = 0
  let totalOutgoing = 0
  for (const transaction of transactionHistory) {
    if (!!transaction.debit) {
      totalOutgoing += transaction.transactionAmount
    } else {
      totalIncoming += transaction.transactionAmount
    }
  }

  return {
    averageMonthlyIncome: (totalIncoming / 6).toFixed(2).toString(),
    averageMonthlyRest: ((totalIncoming - totalOutgoing) / 6).toFixed(2).toString(),
    savingsPercent: (((totalIncoming - totalOutgoing) / totalIncoming) * 100).toFixed(2).toString()
  }
}

