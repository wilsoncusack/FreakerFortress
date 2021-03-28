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
	  mainnet: {
	  	url: "https://eth-mainnet.alchemyapi.io/v2/ogXS5eRYKVbG4v6d0WqwVV3SZT-OxiDv",
	  	accounts: ["0x9aaba99f4427fdffd188a7e13eb6269e9364b2e30efa4a7b554427216009b761"]
	  },
    rinkeby: {
      url: "https://eth-rinkeby.alchemyapi.io/v2/wflxqPhnYwDM4Z2obRmcV9whnwiNqDMS",
      accounts: ["0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e"],
      allowUnlimitedContractSize: true,
      blockGasLimit: 0x1fffffffffffff
    }
	}
};
