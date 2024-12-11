const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Subscription Contract", function () {
  let owner;
  let user;
  let token;
  let subscriptionContract;
  const duration = 86400; // 1 день в секундах
  const initialSupply = 1000000;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy mock ERC20 token
    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    token = await ERC20Mock.deploy("Test Token", "TST", initialSupply + 100);
    await token.deployed();

    // Deploy subscription contract
    const Subscription = await ethers.getContractFactory("Subscription");
    subscriptionContract = await Subscription.deploy(token.address, duration);
    await subscriptionContract.deployed();

    // Transfer some tokens to the user
    await token.transfer(user.address, 100);
  });

  describe("Deployment", function () {
    it("Should set the correct owner, USDT address, and duration", async function () {
      expect(await subscriptionContract.owner()).to.equal(owner.address);
      expect(await subscriptionContract.usdt()).to.equal(token.address);
      expect(await subscriptionContract.duration()).to.equal(duration);
    });
  });

  describe("Pay", function () {
    it("Should allow a user to pay and set their subscription end time", async function () {
      const amount = 100;
      await token.connect(user).approve(subscriptionContract.address, amount);

      await subscriptionContract.connect(user).pay(amount);

      const expectedEndTime = (await ethers.provider.getBlock("latest")).timestamp + (100 * duration);

      expect(await subscriptionContract.endOfSubscription(user.address)).to.equal(expectedEndTime);
      expect(await token.balanceOf(owner.address) - initialSupply).to.equal(amount);
    });

    it("Should revert if the user does not have enough allowance", async function () {
      const amount = 100;
      await expect(subscriptionContract.connect(user).pay(amount)).to.be.reverted;
    });
  });

  describe("isSubscribed", function () {
    it("Should return true if the subscription is active", async function () {
      const amount = 100;
      await token.connect(user).approve(subscriptionContract.address, amount);

      await subscriptionContract.connect(user).pay(amount);

      expect(await subscriptionContract.isSubscribed(user.address)).to.be.true;
    });

    it("Should return false if the subscription has expired", async function () {
      const amount = 100;
      await token.connect(user).approve(subscriptionContract.address, amount);
      await subscriptionContract.connect(user).pay(amount);

      // Fast-forward time beyond subscription end
      await ethers.provider.send("evm_increaseTime", [duration * 1000]);
      await ethers.provider.send("evm_mine");

      expect(await subscriptionContract.isSubscribed(user.address)).to.be.false;
    });
  });

  describe("timeLeft", function () {
    it("Should return the remaining time for the subscription", async function () {
      const amount = 100;
      await token.connect(user).approve(subscriptionContract.address, amount);
      await subscriptionContract.connect(user).pay(amount);

      const remainingTime = await subscriptionContract.timeLeft(user.address);
      expect(remainingTime).to.be.gt(0);
    });

    it("Should return 0 if the subscription has expired", async function () {
      const amount = 100;
      await token.connect(user).approve(subscriptionContract.address, amount);
      await subscriptionContract.connect(user).pay(amount);

      // Fast-forward time beyond subscription end
      await ethers.provider.send("evm_increaseTime", [duration * 1000]);
      await ethers.provider.send("evm_mine");

      expect(await subscriptionContract.timeLeft(user.address)).to.equal(0);
    });
  });
});
