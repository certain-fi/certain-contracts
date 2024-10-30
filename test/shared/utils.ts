import { expect } from "chai";

import { Contract } from "@ethersproject/contracts";
import { ContractReceipt, TypedDataField, Wallet } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const getKeyValue = (key: any) => (obj: any) => obj[key];

export function expectEvent(
  receipt: ContractReceipt,
  contractAddress: string,
  eventName: string,
  args: object,
) {
  const event = receipt.events!.find(
    (e) => e.address == contractAddress && e.event == eventName,
  );
  expect(event).not.to.be.undefined;
  expect(event).not.to.be.null;
  if (args) {
    expect(event!.args).not.to.be.null;
    for (const arg in args) {
      expect(getKeyValue(arg)(event!.args)).to.equal(getKeyValue(arg)(args));
    }
  }
  return event ? event?.args : null;
}

export function expectObject(real: object, expected: object) {
  for (const key in expected) {
    expect(getKeyValue(key)(real)).to.equal(getKeyValue(key)(expected));
  }
}

export async function both(
  contract: Contract,
  method: string,
  args: Array<any> = [],
) {
  const reply = await contract.callStatic[method](...args);
  const receipt = await contract[method](...args);
  return { reply, receipt };
}

export async function signMessage(
  signer: SignerWithAddress | Wallet,
  domain: object,
  types: Record<string, TypedDataField[]>,
  message: Record<string, any>,
) {
  return await signer._signTypedData(domain, types, message);
}
