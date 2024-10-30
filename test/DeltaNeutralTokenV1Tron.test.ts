import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { deployments, ethers, network, run } from "hardhat";
import { DeltaNeutralTokenV1Tron } from "../typechain-types";
import { BigNumberish, Contract } from "ethers";
import { signMessage } from "./shared/utils";

const { getContract, getSigners } = ethers;
const { parseUnits } = ethers.utils;

type PermitStruct = {
  owner: string;
  spender: string;
  value: BigNumberish;
  nonce: BigNumberish;
  deadline: BigNumberish;
};

export const DomainDNT = async (dnt: Contract) => {
  const { chainId } = await ethers.provider.getNetwork();
  const name = await dnt.name();
  return {
    name: name,
    version: "1",
    chainId: chainId,
    verifyingContract: dnt.address,
  };
};

export const TypesPermit = {
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
};

async function signPermit(
  signer: SignerWithAddress,
  dnt: Contract,
  data: PermitStruct,
) {
  return await signMessage(signer, await DomainDNT(dnt), TypesPermit, data);
}

describe("Test DeltaNeutralTokenV1Tron", function () {
  let owner: SignerWithAddress,
    other: SignerWithAddress,
    third: SignerWithAddress;
  let dnt: DeltaNeutralTokenV1Tron;
  let snapshotId: any;

  before(async function () {
    [owner, other, third] = await getSigners();

    await deployments.fixture();

    // Make setup
    await deployments.deploy("DeltaNeutralTokenV1Tron", {
      from: owner.address,
      args: [],
      proxy: {
        proxyContract: "OpenZeppelinTransparentProxy",
        owner: owner.address,
        execute: {
          init: {
            methodName: "initialize",
            args: ["Delta Neutral Token V1", "DNT", owner.address],
          },
        },
      },
      log: true,
    });
    dnt = await getContract("DeltaNeutralTokenV1Tron");
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

  it("should execute permit", async function () {
    const deadline = Date.now();
    const permitSig = await signPermit(owner, dnt, {
      owner: owner.address,
      spender: other.address,
      value: parseUnits("1000", 6),
      nonce: 0,
      deadline: deadline,
    });
    const { v, r, s } = ethers.utils.splitSignature(permitSig);

    const tx = await dnt.permit(
      owner.address,
      other.address,
      parseUnits("1000", 6),
      deadline,
      v,
      r,
      s,
    );
    await expect(tx)
      .to.emit(dnt, "Approval")
      .withArgs(owner.address, other.address, parseUnits("1000", 6));
  });
});
