const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FundManager Contract", function () {
  let fundManager;
  let owner, user1, user2, operator;

  beforeEach(async function () {
    [owner, user1, user2, operator] = await ethers.getSigners();
    const FundManager = await ethers.getContractFactory("FundManager");
    fundManager = await FundManager.deploy();
    await fundManager.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set correct owner", async function () {
      expect(await fundManager.owner()).to.equal(owner.address);
    });

    it("Should not be paused initially", async function () {
      expect(await fundManager.paused()).to.be.false;
    });

    it("Should have zero transaction count", async function () {
      expect(await fundManager.transactionCount()).to.equal(0);
    });
  });

  describe("Deposits", function () {
    it("Should allow valid deposits", async function () {
      const amount = ethers.parseEther("0.01");
      await expect(fundManager.connect(user1).deposit({ value: amount }))
        .to.emit(fundManager, "Deposited");
      expect(await fundManager.balances(user1.address)).to.equal(amount);
    });

    it("Should reject deposits below minimum", async function () {
      const amount = ethers.parseEther("0.0001");
      await expect(
        fundManager.connect(user1).deposit({ value: amount })
      ).to.be.revertedWith("Below minimum deposit");
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      const amount = ethers.parseEther("0.1");
      await fundManager.connect(user1).deposit({ value: amount });
    });

    it("Should allow valid withdrawals", async function () {
      const amount = ethers.parseEther("0.05");
      await expect(fundManager.connect(user1).withdraw(amount))
        .to.emit(fundManager, "Withdrawn");
    });

    it("Should reject withdrawal exceeding balance", async function () {
      const amount = ethers.parseEther("0.2");
      await expect(
        fundManager.connect(user1).withdraw(amount)
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Transfers", function () {
    beforeEach(async function () {
      const amount = ethers.parseEther("0.1");
      await fundManager.connect(user1).deposit({ value: amount });
    });

    it("Should allow valid transfers", async function () {
      const amount = ethers.parseEther("0.03");
      await expect(fundManager.connect(user1).transfer(user2.address, amount))
        .to.emit(fundManager, "Transferred");
      expect(await fundManager.balances(user2.address)).to.equal(amount);
    });

    it("Should reject transfer to zero address", async function () {
      const amount = ethers.parseEther("0.01");
      await expect(
        fundManager.connect(user1).transfer(ethers.ZeroAddress, amount)
      ).to.be.revertedWith("Invalid address");
    });
  });

  describe("Whitelist", function () {
    it("Should allow owner to whitelist", async function () {
      await fundManager.addToWhitelist(user1.address);
      expect(await fundManager.checkWhitelist(user1.address)).to.be.true;
    });

    it("Should not allow non-owner to whitelist", async function () {
      await expect(
        fundManager.connect(user1).addToWhitelist(user2.address)
      ).to.be.revertedWith("Only owner");
    });
  });

  describe("Emergency Controls", function () {
    it("Should allow operator to pause", async function () {
      await expect(fundManager.pause())
        .to.emit(fundManager, "Paused");
      expect(await fundManager.paused()).to.be.true;
    });

    it("Should block operations when paused", async function () {
      await fundManager.pause();
      const amount = ethers.parseEther("0.01");
      await expect(
        fundManager.connect(user1).deposit({ value: amount })
      ).to.be.revertedWith("Contract paused");
    });
  });
});