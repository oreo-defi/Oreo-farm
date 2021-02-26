const { expect } = require("chai");
const truffleAssert = require('truffle-assertions');

describe("Oreo token", function() {
  let oreoToken;
  let owner;
  let acc1;
  let acc2;
  let acc3;
  beforeEach(async () => {
    const OreoToken = await ethers.getContractFactory("OreoToken");
    oreoToken = await OreoToken.deploy();
    [owner, acc1, acc2, acc3] = await ethers.getSigners();
  });
  describe("Normal test", () => {
    it("Should appeare right name", async function() {
      expect(await oreoToken.name()).to.equal("OreoToken");
    });
  
    it("Should appeare right symbol", async function() {
      expect(await oreoToken.symbol()).to.equal("OREO");
    });
  
    it("Should appeare right decimal", async function() {
      expect(await oreoToken.decimals()).to.equal(18);
    });
  
    it("owner can mint", async () => {
  
      await oreoToken.connect(owner).mint(acc2.address, 1000);
  
      const balanceOfAccount2 = await oreoToken.balanceOf(acc2.address);
      expect(balanceOfAccount2.toNumber()).to.equal(1000);
    });
  
    it("after transfer owner role, user can not transfer again", async () => {
      await oreoToken.connect(owner).transferOwnership(acc1.address);
      
      await truffleAssert.fails(
        oreoToken.connect(owner).transferOwnership(acc2.address),
        truffleAssert.ErrorType.REVERT
      );
  
      await truffleAssert.passes(
        oreoToken.connect(acc1).transferOwnership(acc2.address)
      );
    });
  
    it("not owner can not mint", async () => {
      await truffleAssert.fails(
        oreoToken.connect(acc1).mint(acc2.address, 1000),
        truffleAssert.ErrorType.REVERT
      );
    });
  });

  describe("Governance test", () => {
    it("sign fail", async () => {
      await truffleAssert.fails(
        oreoToken.connect(owner).delegateBySig(
          acc1.address,
          10,
          1000,
          10,
          ethers.utils.formatBytes32String("test"),
          ethers.utils.formatBytes32String("test"),
        ),
        truffleAssert.ErrorType.REVERT
      );
    });

    it("should delagate", async () => {
  
      await oreoToken.connect(owner).mint(acc1.address, 1000);
  
      await oreoToken.connect(acc1).delegate(acc3.address);
      expect(await oreoToken.delegates(acc1.address)).to.equal(acc3.address);

      expect(await oreoToken.getCurrentVotes(acc3.address)).to.equal(1000);
    });

    it("should delagate more but number of votes not change", async () => {
  
      await oreoToken.connect(owner).mint(acc1.address, 1000);
  
      await oreoToken.connect(acc1).delegate(acc3.address);
      await oreoToken.connect(acc1).delegate(acc3.address);

      expect(await oreoToken.delegates(acc1.address)).to.equal(acc3.address);

      expect(await oreoToken.getCurrentVotes(acc3.address)).to.equal(1000);
    });

    it("should delagate to another delegatee", async () => {
  
      await oreoToken.connect(owner).mint(acc1.address, 1000);
      await oreoToken.connect(acc1).delegate(acc3.address);
      await oreoToken.connect(acc1).delegate(acc2.address);

      expect(await oreoToken.delegates(acc1.address)).to.equal(acc2.address);

      expect(await oreoToken.getCurrentVotes(acc2.address)).to.equal(1000);
      expect(await oreoToken.getCurrentVotes(acc3.address)).to.equal(0);
    });

    it("should delagate to another delegatee after mint more token", async () => {
  
      await oreoToken.connect(owner).mint(acc1.address, 1000);
      await oreoToken.connect(acc1).delegate(acc3.address);
      await oreoToken.connect(owner).mint(acc1.address, 1000);
      await oreoToken.connect(acc1).delegate(acc2.address);

      expect(await oreoToken.delegates(acc1.address)).to.equal(acc2.address);

      expect(await oreoToken.getCurrentVotes(acc2.address)).to.equal(2000);
      expect(await oreoToken.getCurrentVotes(acc3.address)).to.equal(0);
    });

    it("should delagate with two accounts", async () => {
  
      await oreoToken.connect(owner).mint(acc1.address, 1000);
      await oreoToken.connect(owner).mint(acc2.address, 1000);
      await oreoToken.connect(acc1).delegate(acc3.address);
      await oreoToken.connect(acc2).delegate(acc3.address);

      expect(await oreoToken.getCurrentVotes(acc3.address)).to.equal(2000);
    });

    it("should delagate my self", async () => {
      await oreoToken.connect(owner).mint(acc1.address, 1000);
      oreoToken.connect(acc1).delegate(acc1.address),
      expect(await oreoToken.getCurrentVotes(acc1.address)).to.equal(1000);
    });

    it("should get votes of a current block", async () => {
  
      await oreoToken.connect(owner).mint(acc1.address, 1000);
      await oreoToken.connect(acc1).delegate(acc3.address);
      
      const block = await ethers.provider.getBlockNumber();
      await oreoToken.connect(owner).mint(acc2.address, 1000);
      await oreoToken.connect(acc2).delegate(acc3.address);
      const block2 = await ethers.provider.getBlockNumber();
      await oreoToken.connect(owner).mint(acc2.address, 1000);
      expect(await oreoToken.getPriorVotes(acc3.address, block)).to.equal(1000);
      expect(await oreoToken.getPriorVotes(acc3.address, block2)).to.equal(2000);
    });
  });
});