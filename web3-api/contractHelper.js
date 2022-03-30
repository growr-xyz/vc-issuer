const { ethers } = require("ethers");

const LoanABI = require("./abi/Loan.json");
const ERC20ABI = require("./abi/ERC20.json");
const PondABI = require("./abi/Pond.json");
const PondFactoryABI = require("./abi/PondFactory.json");
const VerificationRegistryABI = require("./abi/VerificationRegistry.json");

const rpcURL = "http://localhost:8545";

// const provider = new ethers.providers.JsonRpcProvider(rpcURL);
const xUSDAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
// const DOCAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const VerificationRegistryAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
const PondFactoryAddress = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
// const WRBTCAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

function onlyUnique(value, index, self) {
	return self.indexOf(value) === index;
  }

  // TODO: cache pond criterias
export const getAllPondsCriteriaNames = async (provider, account) => {
	const signer = provider.getSigner(account);

	const PondFactory = new ethers.Contract(PondFactoryAddress, PondFactoryABI, provider);
	const allPondAddresses = await PondFactory.connect(signer).getAllPonds();

	const res = await Promise.all(
		allPondAddresses.flatMap(async (pondAddress) => {
			const pondCredentilNames = await getPondCriteriaNames(provider, account, { pondAddress });
			return pondCredentilNames;
		})
	);

	const uniqueNames = res.flat().filter(onlyUnique);
	return uniqueNames;
};

export const findBestOffer = async (provider, account, { amount, duration, credentials}) => {
	const signer = provider.getSigner(account);

	const PondFactory = new ethers.Contract(PondFactoryAddress, PondFactoryABI, provider);
	const allPondAddresses = await PondFactory.connect(signer).getAllPonds();

	const res = await Promise.allSettled(
		allPondAddresses.map(async (pondAddress) => {
			const Pond = new ethers.Contract(pondAddress, PondABI, provider);
			const { match, containsAll } = await filterOnlyPondCredentials(provider, account, { pondAddress, credentials })
			if (!containsAll) {
				throw Error(`Not all credentials are passed to this pond ${pondAddress}`);
			}
			return {
				pondAddress,
				details: await Pond.getLoanOffer(ethers.utils.parseEther(amount), duration, match.arrays),
			};
		})
	);
	let bestOffersRate = [];
	let bestOffersAmount = [];
	let bestOffersDuration = [];

	// min interest rate
	res.forEach((r) => {
		if (r.status != "fulfilled") return;
		const offer = r.value;

		if (bestOffersRate.length == 0) {
			return bestOffersRate.push(offer);
		}

		if (
			Number(bestOffersRate[0].details.annualInterestRate.toString()) >
			Number(offer.details.annualInterestRate.toString())
		) {
			bestOffersRate = [offer];
		} else if (
			Number(bestOffersRate[0].details.annualInterestRate.toString()) ===
			Number(offer.details.annualInterestRate.toString())
		) {
			bestOffersRate.push(offer);
		}
	});

	// if (bestOffersRate.length < 2) return bestOffersRate;

	bestOffersRate.forEach((offer) => {
		if (bestOffersAmount.length == 0) {
			return bestOffersAmount.push(offer);
		}

		if (
			Number(ethers.utils.formatEther(offer.details.amount.toString())) >
			Number(ethers.utils.formatEther(bestOffersAmount[0].details.amount))
		) {
			bestOffersAmount = [offer];
		} else if (
			Number(ethers.utils.formatEther(offer.details.amount)) ===
			Number(ethers.utils.formatEther(bestOffersAmount[0].details.amount))
		) {
			bestOffersAmount.push(offer);
		}
	});

	bestOffersAmount.forEach((offer) => {
		if (bestOffersDuration.length == 0) {
			return bestOffersDuration.push(offer);
		}

		if (Number(offer.details.duration.toString()) > Number(bestOffersDuration[0].details.duration.toString())) {
			bestOffers = [offer];
		} else if (
			Number(offer.details.duration.toString()) === Number(bestOffersDuration[0].details.duration.toString())
		) {
			bestOffers.push(offer);
		}
	});

	return bestOffersDuration.length > 0 ? bestOffersDuration[0] : null;
};

export const getPondCriteriaNames = async (provider, account, { pondAddress }) => {
	const Pond = new ethers.Contract(pondAddress, PondABI, provider);

	const criteriaNames = await Pond.getCriteriaNames();

	return criteriaNames;
}

export const filterOnlyPondCredentials = async (provider, account, { pondAddress, credentials }) => {
	const criteriaNames = await getPondCriteriaNames(provider, account, { pondAddress });

	const userValidCredentials = Object.fromEntries(
		Object.entries(credentials).filter(([name, value]) => criteriaNames.includes(name))
	);

	const names = Object.keys(userValidCredentials);
	const contents = Object.values(userValidCredentials);

	const containsAll = names.length === criteriaNames.length;

	return {
		neededNames: criteriaNames,
		match: {
			json: userValidCredentials,
			arrays: { names, contents }
		},
		containsAll,
	}
};

export const verifyCredentials = async (provider, account, { pondAddress, credentials }) => {
	const { match, containsAll } = await filterOnlyPondCredentials(provider, account, { pondAddress, credentials });

	if (!containsAll) {
		return false;
	}

	const Pond = new ethers.Contract(pondAddress, PondABI, provider);

	const valid = await Pond.verifyCredentials(match.arrays);

	return valid && criteriaNames;
};

export const registerVerification = async (provider, verifier, { borrower, pondAddress }) => {
	const signer = provider.getSigner(verifier);
	const VerificationRegistry = new ethers.Contract(VerificationRegistryAddress, VerificationRegistryABI, provider);
	const validity = 60 * 60; // 1 hour in seconds

	const tx = await VerificationRegistry.connect(signer).registerVerification(borrower, pondAddress, validity);
	return tx.wait();
};

export const borrow = async (provider, borrower, { amount, duration, pondAddress }) => {
	const signer = provider.getSigner(borrower);

	const Pond = new ethers.Contract(pondAddress, PondABI, provider);

	const tx = await Pond.connect(signer).borrow(amount, duration);
	return tx.wait();
};

export const repay = async (provider, borrower, { pondAddress, amount }) => {
	const signer = provider.getSigner(borrower);

	const Pond = new ethers.Contract(pondAddress, PondABI, provider);
	const xUSD = new ethers.Contract(xUSDAddress, ERC20ABI, provider);

	const loanAddress = await Pond.getLoan(borrower);
	const repayAmount = ethers.utils.parseEther(amount);

	Pond.once("RepayLoan", (loanAddr, senderAddr, repaidAmount, timestamp, event) => {
		console.log(loanAddr, senderAddr, repaidAmount, timestamp);
	});

	await xUSD.connect(signer).approve(pondAddress, repayAmount);
	const tx = await Pond.connect(signer).repay(repayAmount, loanAddress);
	return await tx.wait();
};

export const fetchRepaymentHistory = async (provider, borrower, { pondAddress }) => {
	const iface = new ethers.utils.Interface(PondABI);
	const Pond = new ethers.Contract(pondAddress, PondABI, provider);

	const loanAddress = await Pond.getLoan(borrower);

	const filter = Pond.filters.RepayLoan(loanAddress, borrower);
	const events = await Pond.queryFilter(filter);

	return events.map((event) => iface.decodeEventLog("RepayLoan", event.data));
};

export const getLoanDetails = async (provider, borrower, { pondAddress }) => {
	const Pond = new ethers.Contract(pondAddress, PondABI, provider);

	const loanAddress = await Pond.getLoan(borrower);
	const Loan = new ethers.Contract(loanAddress, LoanABI, provider);

	const details = await Loan.getDetails();

	return details;
};
