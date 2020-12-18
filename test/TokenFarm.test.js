const { assert } = require("chai");

const TokenFarm = artifacts.require("TokenFarm");
const DappToken = artifacts.require("DappToken");
const DaiToken = artifacts.require("DaiToken");

require("chai")
  .use(require("chai-as-promised"))
  .should();

function tokens(n) {
  return web3.utils.toWei(n, "ether");
}

contract("TokenFarm", ([owner, investor]) => {
  let daiToken, dappToken, tokenFarm;

  before(async () => {
    daiToken = await DaiToken.new();
    dappToken = await DappToken.new();
    tokenFarm = await TokenFarm.new(dappToken.address, daiToken.address);

    await dappToken.transfer(tokenFarm.address, tokens("1000000"));

    await daiToken.transfer(investor, tokens("10"), { from: owner });
  });

  describe("Mock Dai deployment", async () => {
    it("has a name", async () => {
      const name = await daiToken.name();
      assert.equal(name, "Mock DAI Token");
    });
  });

  describe("Dapp Token Deployment", async () => {
    it("has a name", async () => {
      const name = await dappToken.name();
      assert(name, "DappToken");
    });
  });

  describe("TOken Farm Deployment", async () => {
    it("has a name ", async () => {
      const name = await tokenFarm.name();
      assert(name, "DApp Token Farm");
    });

    it("contract has TOkens", async () => {
      let balance = await dappToken.balanceOf(tokenFarm.address);
      assert.equal(balance.toString(), tokens("1000000"));
    });
  });

  describe("Farming Tokens", async () => {
    it("rewards Tokens for Staking mDai Tokens", async () => {
      let result;

      result = await daiToken.balanceOf(investor);
      assert(
        result,
        tokens("100"),
        "investor Mock Dai wallet correct before staking"
      );
      await daiToken.approve(tokenFarm.address, tokens("10"), {
        from: investor,
      });
      await tokenFarm.stakeTokens(tokens("10"), { from: investor });

      result = await daiToken.balanceOf(investor);
      assert(
        result.toString(),
        tokens("0"),
        "investor MockDai wallet correct after staking"
      );

      result = await tokenFarm.isStaking(investor);
      assert(
        result.toString(),
        "true",
        "investor staking status correct after staking"
      );

      await tokenFarm.issueTokens({ from: owner });

      result = await dappToken.balanceOf(investor);
      assert.equal(
        result.toString(),
        tokens("10"),
        "investor Dapp Token wallet balance correct after issuing tokens"
      );
      await tokenFarm.issueTokens({ from: investor }).should.be.rejected;

      await tokenFarm.unstakeTokens({ from: investor });

      result = await daiToken.balanceOf(investor);
      assert.equal(
        result,
        tokens("10"),
        "correct the investor mDai wallet after un staking"
      );
      result = await daiToken.balanceOf(tokenFarm.address);
      assert.equal(
        result,
        tokens("0"),
        "token Farm MockDai balance correct after staking"
      );

      result = await tokenFarm.stakingBalance(investor);
      assert.equal(
        result,
        tokens("0"),
        "token Farm MockDai balance correct after staking"
      );

      result = await tokenFarm.isStaking(investor);
      assert.equal(
        result.toString(),
        "false",
        "investor staking status correct after unStaking"
      );
    });
  });
});
