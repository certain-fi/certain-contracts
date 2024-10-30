import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { deployments, ethers, network, run } from "hardhat";
import { DeltaNeutralTokenV1 } from "../typechain-types";

const { getContract, getSigners } = ethers;
const { parseUnits } = ethers.utils;

const DNT_DECIMALS = 6;

describe("Test DeltaNeutralTokenV1", function () {
  let owner: SignerWithAddress,
    other: SignerWithAddress,
    third: SignerWithAddress;
  let dnt: DeltaNeutralTokenV1;
  let snapshotId: any;

  before(async function () {
    [owner, other, third] = await getSigners();

    await deployments.fixture();

    // Make setup
    await run("deploy:dnt", { name: "Delta Neutral Token V1", symbol: "DNT" });
    dnt = await getContract("DeltaNeutralTokenV1");
  });

  beforeEach(async function () {
    snapshotId = await network.provider.request({
      method: "evm_snapshot",
      params: [],
    });
  });

  afterEach(async function () {
    snapshotId = await network.provider.request({
      method: "evm_revert",
      params: [snapshotId],
    });
  });

  describe("General", function () {
    it("has correct name, symbol & decimals", async function () {
      expect(await dnt.name()).to.equal("Delta Neutral Token V1");
      expect(await dnt.symbol()).to.equal("DNT");
      expect(await dnt.decimals()).to.equal(DNT_DECIMALS);
    });
  });

  describe("Mint & Burn", function () {
    it("mints", async function () {
      await dnt.mint(other.address, parseUnits("100", DNT_DECIMALS));
      expect(await dnt.balanceOf(other.address)).to.equal(
        parseUnits("100", DNT_DECIMALS),
      );
    });

    it("reverts mint if not owner", async function () {
      await expect(
        dnt.connect(other).mint(other.address, parseUnits("100", DNT_DECIMALS)),
      ).to.be.revertedWithCustomError(dnt, "OwnableUnauthorizedAccount");
    });

    it("batch mints", async function () {
      await dnt.batchMint(
        [other.address, third.address],
        [parseUnits("100", DNT_DECIMALS), parseUnits("100", DNT_DECIMALS)],
      );

      expect(await dnt.balanceOf(other.address)).to.equal(
        parseUnits("100", DNT_DECIMALS),
      );
      expect(await dnt.balanceOf(third.address)).to.equal(
        parseUnits("100", DNT_DECIMALS),
      );
    });

    it("reverts batch mint if not owner", async function () {
      await expect(
        dnt
          .connect(other)
          .batchMint(
            [other.address, third.address],
            [parseUnits("100", DNT_DECIMALS), parseUnits("100", DNT_DECIMALS)],
          ),
      ).to.be.revertedWithCustomError(dnt, "OwnableUnauthorizedAccount");
    });

    it("reverts batch mint on length mismatch", async function () {
      await expect(
        dnt.batchMint(
          [other.address],
          [parseUnits("100", DNT_DECIMALS), parseUnits("100", DNT_DECIMALS)],
        ),
      ).to.be.revertedWithCustomError(dnt, "LengthMismatch");
    });

    it("burns", async function () {
      await dnt.mint(owner.address, parseUnits("100", DNT_DECIMALS));
      await dnt.burn(parseUnits("100", DNT_DECIMALS));
      expect(await dnt.balanceOf(owner.address)).to.equal(0);
    });

    it("reverts burn if not owner", async function () {
      await dnt.mint(other.address, parseUnits("100", DNT_DECIMALS));
      await expect(
        dnt.connect(other).burn(parseUnits("100", DNT_DECIMALS)),
      ).to.be.revertedWithCustomError(dnt, "OwnableUnauthorizedAccount");
    });
  });

  describe("Blacklist", function () {
    it("adds to blacklist", async function () {
      await dnt.setBlacklisted(other.address, true);
      expect(await dnt.isBlacklisted(other.address)).to.be.true;
    });

    it("emits event", async function () {
      await expect(dnt.setBlacklisted(other.address, true))
        .to.emit(dnt, "BlacklistedUpdated")
        .withArgs(other.address, true);
    });

    it("reverts blacklisting if not owner", async function () {
      await expect(
        dnt.connect(other).setBlacklisted(owner.address, true),
      ).to.be.revertedWithCustomError(dnt, "OwnableUnauthorizedAccount");
    });

    it("reverts transfer to blacklisted account", async function () {
      await dnt.mint(owner.address, parseUnits("100", DNT_DECIMALS));
      await dnt.setBlacklisted(other.address, true);

      await expect(
        dnt.transfer(other.address, parseUnits("100", DNT_DECIMALS)),
      ).to.be.revertedWithCustomError(dnt, "ReceiverBlacklisted");
    });

    it("reverts transfer from blacklisted account", async function () {
      await dnt.mint(owner.address, parseUnits("100", DNT_DECIMALS));
      await dnt.setBlacklisted(owner.address, true);

      await expect(
        dnt.transfer(other.address, parseUnits("100", DNT_DECIMALS)),
      ).to.be.revertedWithCustomError(dnt, "SenderBlacklisted");
    });

    it("black funds handling", async function () {
      await dnt.mint(other.address, parseUnits("100", DNT_DECIMALS));

      await expect(
        dnt.destroyBlackFunds(other.address),
      ).to.be.revertedWith("Account is not blacklisted");

      await dnt.setBlacklisted(other.address, true);
      expect(await dnt.balanceOf(other.address)).to.not.equal(0);

      await expect(dnt.destroyBlackFunds(other.address))
          .to.emit(dnt, "BlacklistedFundsDestroyed")
          .withArgs(other.address, parseUnits("100", DNT_DECIMALS));

      expect(await dnt.balanceOf(other.address)).to.equal(0);
      expect(await dnt.isBlacklisted(other.address)).to.be.true;

      await expect(
        dnt.connect(other).destroyBlackFunds(owner.address),
      ).to.be.revertedWithCustomError(dnt, "OwnableUnauthorizedAccount");
    });
  });

  describe("Batch operations", function () {
    this.beforeEach(async function () {
      await dnt.mint(owner.address, parseUnits("100", DNT_DECIMALS));
    });

    it("batch transfers", async function () {
      await dnt.batchTransfer(
        [other.address, third.address],
        [parseUnits("50", DNT_DECIMALS), parseUnits("40", DNT_DECIMALS)],
      );

      expect(await dnt.balanceOf(owner.address)).to.equal(
        parseUnits("10", DNT_DECIMALS),
      );
      expect(await dnt.balanceOf(other.address)).to.equal(
        parseUnits("50", DNT_DECIMALS),
      );
      expect(await dnt.balanceOf(third.address)).to.equal(
        parseUnits("40", DNT_DECIMALS),
      );
    });

    it("reverts batch transfer on length mismatch", async function () {
      await expect(
        dnt.batchTransfer(
          [other.address, third.address],
          [parseUnits("50", DNT_DECIMALS)],
        ),
      ).to.be.revertedWithCustomError(dnt, "LengthMismatch");
    });

    it("batch transfers from", async function () {
      await dnt.transfer(other.address, parseUnits("100", DNT_DECIMALS));
      await dnt
        .connect(other)
        .approve(owner.address, parseUnits("100", DNT_DECIMALS));

      await dnt.batchTransferFrom(
        [other.address, other.address],
        [owner.address, third.address],
        [parseUnits("50", DNT_DECIMALS), parseUnits("40", DNT_DECIMALS)],
      );

      expect(await dnt.balanceOf(owner.address)).to.equal(
        parseUnits("50", DNT_DECIMALS),
      );
      expect(await dnt.balanceOf(other.address)).to.equal(
        parseUnits("10", DNT_DECIMALS),
      );
      expect(await dnt.balanceOf(third.address)).to.equal(
        parseUnits("40", DNT_DECIMALS),
      );
    });

    it("uses allowance in batch transfer from", async function () {
      await dnt.transfer(other.address, parseUnits("100", DNT_DECIMALS));
      await dnt
        .connect(other)
        .approve(owner.address, parseUnits("95", DNT_DECIMALS));

      await dnt.batchTransferFrom(
        [other.address, other.address],
        [owner.address, third.address],
        [parseUnits("50", DNT_DECIMALS), parseUnits("40", DNT_DECIMALS)],
      );

      expect(await dnt.allowance(other.address, owner.address)).to.equal(
        parseUnits("5", DNT_DECIMALS),
      );

      await expect(
        dnt.batchTransferFrom(
          [other.address],
          [owner.address],
          [parseUnits("10", DNT_DECIMALS)],
        ),
      ).to.be.revertedWithCustomError(dnt, "ERC20InsufficientAllowance");
    });

    it("reverts batch transfer from on length mismatch", async function () {
      await expect(
        dnt.batchTransferFrom(
          [other.address, other.address],
          [owner.address],
          [parseUnits("50", DNT_DECIMALS), parseUnits("40", DNT_DECIMALS)],
        ),
      ).to.be.revertedWithCustomError(dnt, "LengthMismatch");

      await expect(
        dnt.batchTransferFrom(
          [other.address, other.address],
          [owner.address, owner.address],
          [parseUnits("50", DNT_DECIMALS)],
        ),
      ).to.be.revertedWithCustomError(dnt, "LengthMismatch");
    });

    it("batch approves", async function () {
      await dnt.batchApprove(
        [other.address, third.address],
        [parseUnits("50", DNT_DECIMALS), parseUnits("40", DNT_DECIMALS)],
      );

      expect(await dnt.allowance(owner.address, other.address)).to.equal(
        parseUnits("50", DNT_DECIMALS),
      );
      expect(await dnt.allowance(owner.address, third.address)).to.equal(
        parseUnits("40", DNT_DECIMALS),
      );

      await dnt
        .connect(other)
        .transferFrom(
          owner.address,
          other.address,
          parseUnits("50", DNT_DECIMALS),
        );

      expect(await dnt.balanceOf(owner.address)).to.equal(
        parseUnits("50", DNT_DECIMALS),
      );
      expect(await dnt.balanceOf(other.address)).to.equal(
        parseUnits("50", DNT_DECIMALS),
      );
    });

    it("reverts batch approve on length mismatch", async function () {
      await expect(
        dnt.batchApprove(
          [other.address, third.address],
          [parseUnits("50", DNT_DECIMALS)],
        ),
      ).to.be.revertedWithCustomError(dnt, "LengthMismatch");
    });
  });
});
