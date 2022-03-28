const axios = require('axios')
const { pubsub } = require('../graphql/helper')

let instance

const BankConnection = (host, key) => {
  const apiHost = host
  const apiKey = key
  let userToken
  let userAccounts
  let userData = {}
  let error
  instance = {
    login: async (username, password) => {
      try {
        const config = {
          method: 'post',
          url: `${apiHost}/my/logins/direct`,
          headers: {
            'Content-Type': 'application/json',
            'DirectLogin': `username=${username}, password=${password}, consumer_key=${apiKey}`
          }
        };
        const { token } = (await axios(config)).data
        userToken = token
        return { success: !!userToken }
      } catch (e) {
        if (e.message === "Request failed with status code 504") {
          this.error = 504
          return { success: true }
        }
        throw e
      }
    },

    getCustomers: async () => {
      const config = {
        method: 'get',
        url: `${apiHost}/obp/v4.0.0/users/current/customers`,
        headers: {
          'Content-Type': 'application/json',
          'DirectLogin': `token=${userToken}`,
        }
      }
      let customers
      if (this.error === 504) {
        customers = require('../mock/bh_customer_data.js')
      } else {
        customers = (await (axios(config))).data.customers
      }
      const user = {}

      console.log(customers)

      user.dateOfBirth = customers[0]?.date_of_birth
      user.relationshipStatus = customers[0]?.relationship_status?.toUpperCase()
      user.dependants = { dependants: customers[0]?.dependants, dependantsDoB: customers[0]?.dob_of_dependants }
      user.education = customers[0]?.highest_education_attained
      user.employmentStatus = customers[0]?.employment_status
      user.highestEducationAttained = customers[0]?.highest_education_attained
      user.kycStatus = customers[0]?.kyc_status

      user.creditScores = customers.map(customer => {
        return {
          bankId: customer.bank_id,
          creditRating: customer.credit_rating,
          creditLimit: customer.credit_limit
        }
      })
      this.userData = user
      return this.userData
    },

    getUserAccounts: async (bankId) => {
      const config = {
        method: 'get',
        url: `${apiHost}/obp/v4.0.0/banks/${bankId}/accounts`,
        headers: {
          'Content-Type': 'application/json',
          'DirectLogin': `token=${userToken}`,
        }
      }
      userAccountIds = (await axios(config)).data.map(a => a.id)

      return userAccountIds
    },

    getUserAccount: async (bankId, accountId) => {
      const config = {
        method: 'get',
        url: `${apiHost}/obp/v4.0.0/my/banks/${bankId}/accounts/${accountId}/account`,
        headers: {
          'Content-Type': 'application/json',
          'DirectLogin': `token=${userToken}`,
        }
      }
      return (await axios(config)).data
    },

    getUserTransferHistory: async (bankId, accountId) => {
      const config = {
        method: 'get',
        url: `${apiHost}/obp/v4.0.0/my/banks/${bankId}/accounts/${accountId}/transactions`,
        headers: {
          'Content-Type': 'application/json',
          'DirectLogin': `token=${userToken}`,
        }
      }
      return (await axios(config)).data
    },

    getUserData: () => userData,
    setUserData: (newData) => {
      userData = newData
      return userData
    }


  }
  return instance
}

const getAllUserAccounts = async () => {
  const userData = instance.getUserData()
  const promises = []
  for (const id in userData.wallet) {
    promises.push(instance.getUserAccounts(userData.wallet[id].bankId))
  }
  const results = await Promise.all(promises)
  for (const i in results) {
    if (results[i].length > 0) {
      userData.wallet[i].accountId = results[i][0]
    }
  }
  instance.setUserData(userData)
  pubsub.publish('commands', {
    command: 'getUserAccountById'
  })
  return true
}

const getUserAccountById = async () => {
  const userData = instance.getUserData()
  const promises = []
  const walletIds = []
  for (const id in userData.wallet) { // not great. can be trimmed on previous step. will mess up the next for though. fix it!
    if (userData.wallet[id].accountId) {
      walletIds.push(id)
      promises.push(instance.getUserAccount(userData.wallet[id].bankId, userData.wallet[id].accountId))
    }
  }
  const result = await Promise.all(promises)
  for (const id in walletIds) {
    userData.wallet[walletIds[id]].accountBalance = result[id].balance
    userData.wallet[walletIds[id]].accountProductCode = result[id].product_code
    userData.wallet[walletIds[id]].accountNumber = result[id].number
  }
  userData.walletIds = walletIds
  instance.setUserData(userData)
  pubsub.publish('commands', {
    command: 'getUserTransferHistory'
  })
  return true
}

const getAccumulationRate = ({ transactions }) => {
  const balanceSheet = []
  let income = 0
  let spending = 0

  function roundToThree(num) {
    return +(Math.round(num + "e+3") + "e-3");
  }

  let incomeToIncomeSnapshot = [{ income: 0, spending: 0 }]

  transactions.reverse().forEach((transaction, index) => {
    const currency = transaction.details.value.currency
    balanceSheet.push(Object.assign({}, {
      [currency]: {
        value: transaction.details.value.amount,
        balance: transaction.details.new_balance.amount
      }
    }))
    const value = roundToThree(transaction.details.value.amount)
    if (index === 0) {
      incomeToIncomeSnapshot[0] = value > 0 ? { date: transaction.details.completed, income: income + value, spending: 0 } : { date: transaction.details.completed, income: 0, spending: 0 + value }
      income = incomeToIncomeSnapshot[index].income
      spending = incomeToIncomeSnapshot[index].spending

    } else {
      if (value > 0) {
        incomeToIncomeSnapshot.push({ date: transaction.details.completed, income: value, spending: spending })
        spending = 0
      } else if (value < 0) {
        spending += value
        income = 0
      }
    }
  })
  incomeToIncomeSnapshot.shift()
  incomeToIncomeSnapshot.forEach((row, index) => {
    if (index < (incomeToIncomeSnapshot.length - 1)) {
      incomeToIncomeSnapshot[index].delta = (row.spending + incomeToIncomeSnapshot[index].income)
    } else if (index === (incomeToIncomeSnapshot.length - 1)) {
      incomeToIncomeSnapshot[index].delta = (row.income + row.spending)
    }
  })
  incomeToIncomeSnapshot.shift()

  let accumulationRate = 0

  incomeToIncomeSnapshot.forEach(e => accumulationRate = accumulationRate + e.delta)

  return accumulationRate / incomeToIncomeSnapshot.length

}

const getUserTransferHistory = async () => {
  const userData = instance.getUserData()
  const promises = []
  const walletIds = userData.walletIds
  for (const id of walletIds) {
    promises.push(instance.getUserTransferHistory(userData.wallet[id].bankId, userData.wallet[id].accountId))
  }
  const result = await Promise.all(promises)
  // assuming only one wallet to move forward
  const accumulationRate = getAccumulationRate(result[0])
  return accumulationRate
}

const commandResolver = async (command, data) => {
  switch (command) {
    case 'getUserAccounts': {
      await getAllUserAccounts()
      break;
    }
    case 'getUserAccountById': {
      await getUserAccountById()
      break;
    }
    case 'getUserTransferHistory': {
      const accumulationRate = await getUserTransferHistory()
      let score = 0
      let monthsWithBallance = instance.getUserData().wallet[instance.getUserData().walletIds[0]].accountBalance.amount / accumulationRate
      if (monthsWithBallance > 0) score = 10
      else {
        score = 10 - Math.round((12 / Math.abs(monthsWithBallance)))
      }
      const ratingMap = {
        A: 0,
        B: -1,
        C: -2,
        D: -3,
        E: -4,
        F: -5
      }

      score = score + (ratingMap[instance.getUserData().wallet[instance.getUserData().walletIds[0]].creditRating.rating])
      pubsub.publish('commands', {
        command: 'storeScore',
        score
      })
      break;
    }
    case 'storeScore': {
      const userWallet = instance.getUserData().address
      const user = await userModel.findOneAndUpdate({ wallet: userWallet }, { score: data })
      const updUser = await userModel.findById(user._id)
      pubsub.publish('userTopic', { user: updUser._doc })
      break;
    }
  }
}

pubsub.subscribe('commands', (message) => {
  commandResolver(message.command, message.score)
})

module.exports = BankConnection