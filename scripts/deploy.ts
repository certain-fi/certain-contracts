import hre from "hardhat";

async function main() {
  await hre.run("deploy:dnt", {
    name: "DeltaNeutralTokenV1",
    symbol: "DNT",
    owner: process.env.INITIAL_OWNER,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
