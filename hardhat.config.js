require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");


module.exports = {
  solidity: "0.8.2",
  gasReporter: {
    currency: 'USD',
    gasPrice: 38
  },
  networks: {
	  hardhat: {
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      allowUnlimitedContractSize: true,
      blockGasLimit: 0x1fffffffffffff
    },
	}
};
