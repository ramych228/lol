const { deployments, ethers, getNamedAccounts } = require('hardhat');
const hardhat = require("hardhat");
const hre = require("hardhat");

async function main() {
    await hardhat.run("compile");

    let deployer = await getNamedAccounts();
    console.log(deployer);

    let sub = await deployments.deploy("Subscription", {
        from: deployer.deployer,
        args: ["0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", 100],
        log: true,
    });

    

    // await sub.waitForDeployment();


}



main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });