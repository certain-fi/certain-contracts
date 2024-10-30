import { task } from "hardhat/config";

task("deploy:dnt", "Deploy DeltaNeutralTokenV1 contract")
  .addParam("name", "ERC20 name")
  .addParam("symbol", "ERC20 symbol")
  .addOptionalParam("owner", "Contract owner address")
  .setAction(async function (
    { name, symbol, owner },
    { getNamedAccounts, deployments: { deploy } },
  ) {
    const { deployer } = await getNamedAccounts();

    const initialOwner = owner ?? deployer;

    return await deploy("DeltaNeutralTokenV1", {
      from: deployer,
      args: [],
      proxy: {
        proxyContract: "OpenZeppelinTransparentProxy",
        owner: initialOwner,
        execute: {
          init: {
            methodName: "initialize",
            args: [name, symbol, initialOwner],
          },
        },
      },
      log: true,
    });
  });
