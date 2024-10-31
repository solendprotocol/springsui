import fs from "fs";

import { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { fromHex } from "@mysten/sui/utils";
import { program } from "commander";

import * as sdk from "../../sdk/src";
import { LstClient } from "../../sdk/src";
import { PACKAGE_ID } from "../../sdk/src/_generated/liquid_staking";

const LIQUID_STAKING_INFO = {
  id: "0x15eda7330c8f99c30e430b4d82fd7ab2af3ead4ae17046fcb224aa9bad394f6b",
  type: "0x83556891f4a0f233ce7b05cfe7f957d4020492a34f5405b2cb9377d060bef4bf::spring_sui::SPRING_SUI",
  weightHookId:
    "0xbbafcb2d7399c0846f8185da3f273ad5b26b3b35993050affa44cfa890f1f144",
};

const RPC_URL = "https://fullnode.mainnet.sui.io";

// const keypair = Ed25519Keypair.fromSecretKey(
//   fromBase64(process.env.SUI_SECRET_KEY!),
// );

const keypair = Ed25519Keypair.fromSecretKey(
  fromHex(fs.readFileSync(process.env.SUI_SECRET_KEY_PATH!).toString()),
);

async function mint(options: any) {
  const client = new SuiClient({ url: RPC_URL });
  const lstClient = await LstClient.initialize(client, LIQUID_STAKING_INFO);

  const tx = new Transaction();
  const [sui] = tx.splitCoins(tx.gas, [BigInt(options.amount)]);
  const rSui = lstClient.mint(tx, sui);
  tx.transferObjects([rSui], keypair.toSuiAddress());

  const txResponse = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
    },
  });

  console.log(txResponse);
}

async function redeem(options: any) {
  const client = new SuiClient({ url: RPC_URL });

  const lstCoins = await client.getCoins({
    owner: keypair.toSuiAddress(),
    coinType: LIQUID_STAKING_INFO.type,
    limit: 1000,
  });

  const tx = new Transaction();
  const lstClient = await LstClient.initialize(client, LIQUID_STAKING_INFO);

  if (lstCoins.data.length > 1) {
    tx.mergeCoins(
      lstCoins.data[0].coinObjectId,
      lstCoins.data.slice(1).map((c) => c.coinObjectId),
    );
  }

  const [lst] = tx.splitCoins(lstCoins.data[0].coinObjectId, [
    BigInt(options.amount),
  ]);
  const sui = lstClient.redeemLst(tx, lst);

  tx.transferObjects([sui], keypair.toSuiAddress());

  const txResponse = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
    },
  });

  console.log(txResponse);
}

async function increaseValidatorStake(options: any) {
  const client = new SuiClient({ url: RPC_URL });
  const lstClient = await LstClient.initialize(client, LIQUID_STAKING_INFO);

  const adminCapId = await lstClient.getAdminCapId(keypair.toSuiAddress());
  if (!adminCapId) return;

  const tx = new Transaction();
  lstClient.increaseValidatorStake(
    tx,
    adminCapId,
    options.validatorAddress,
    options.amount,
  );

  const txResponse = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
    },
  });

  console.log(txResponse);
}

async function decreaseValidatorStake(options: any) {
  const client = new SuiClient({ url: RPC_URL });
  const lstClient = await LstClient.initialize(client, LIQUID_STAKING_INFO);

  const adminCapId = await lstClient.getAdminCapId(keypair.toSuiAddress());
  if (!adminCapId) return;

  const tx = new Transaction();
  lstClient.decreaseValidatorStake(
    tx,
    adminCapId,
    options.validatorIndex,
    options.amount,
  );

  const txResponse = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
    },
  });

  console.log(txResponse);
}

async function updateFees(options: any) {
  const client = new SuiClient({ url: RPC_URL });
  const lstClient = await LstClient.initialize(client, LIQUID_STAKING_INFO);

  const adminCap = (
    await client.getOwnedObjects({
      owner: keypair.toSuiAddress(),
      filter: {
        StructType: `${PACKAGE_ID}::liquid_staking::AdminCap<${LIQUID_STAKING_INFO.type}>`,
      },
    })
  ).data[0];
  const adminCapId = adminCap.data?.objectId;
  if (!adminCapId) return;

  const tx = new Transaction();
  lstClient.updateFees(tx, adminCapId, options);

  const txResponse = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
    },
  });

  console.log(txResponse);
}

async function initializeWeightHook(options: any) {
  const client = new SuiClient({ url: RPC_URL });
  const lstClient = await LstClient.initialize(client, LIQUID_STAKING_INFO);

  const adminCapId = await lstClient.getAdminCapId(keypair.toSuiAddress());
  if (!adminCapId) return;

  const tx = new Transaction();
  const weightHookAdminCap = lstClient.initializeWeightHook(tx, adminCapId);
  tx.transferObjects([weightHookAdminCap], keypair.toSuiAddress());

  const txResponse = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
    },
  });

  console.log(txResponse);
}

async function setValidatorAddressesAndWeights(options: any) {
  const client = new SuiClient({ url: RPC_URL });
  const lstClient = await LstClient.initialize(client, LIQUID_STAKING_INFO);

  if (options.validators.length != options.weights.length) {
    throw new Error("Validators and weights arrays must be of the same length");
  }

  const validatorAddressesAndWeights = new Map();
  for (let i = 0; i < options.validators.length; i++) {
    validatorAddressesAndWeights.set(
      options.validators[i],
      options.weights[i] as number,
    );
  }

  console.log(validatorAddressesAndWeights);

  const weightHookAdminCapId = await lstClient.getWeightHookAdminCapId(
    keypair.toSuiAddress(),
  );
  if (!weightHookAdminCapId) return;

  const tx = new Transaction();
  lstClient.setValidatorAddressesAndWeights(
    tx,
    LIQUID_STAKING_INFO.weightHookId,
    weightHookAdminCapId,
    validatorAddressesAndWeights,
  );

  const txResponse = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
    },
  });

  console.log(txResponse);
}

async function rebalance(options: any) {
  const client = new SuiClient({ url: RPC_URL });
  const lstClient = await LstClient.initialize(client, LIQUID_STAKING_INFO);

  const tx = new Transaction();
  lstClient.rebalance(tx, LIQUID_STAKING_INFO.weightHookId);

  const txResponse = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
    },
  });

  console.log(txResponse);
}

async function eject(options: any) {
  const client = new SuiClient({ url: RPC_URL });
  const lstClient = await LstClient.initialize(client, LIQUID_STAKING_INFO);
  const weightHookAdminCapId = await lstClient.getWeightHookAdminCapId(
    keypair.toSuiAddress(),
  );
  if (!weightHookAdminCapId) return;

  const tx = new Transaction();
  lstClient.eject(tx, weightHookAdminCapId);

  const txResponse = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
    },
  });

  console.log(txResponse);
}

program.version("1.0.0").description("Spring Sui CLI");

program
  .command("mint")
  .description("mint some rSui")
  .option("--amount <SUI>", "Amount of SUI in MIST")
  .action(mint);

program
  .command("redeem")
  .description("redeem some SUI")
  .option("--amount <LST>", "Amount of LST to redeem")
  .action(redeem);

program
  .command("increase-validator-stake")
  .description("increase validator stake")
  .option("--validator-address <VALIDATOR>", "Validator address")
  .option("--amount <SUI>", "Amount of SUI to delegate to validator")
  .action(increaseValidatorStake);

program
  .command("decrease-validator-stake")
  .description("decrease validator stake")
  .option("--validator-index <VALIDATOR_INDEX>", "Validator index")
  .option("--amount <SUI>", "Amount of SUI to undelegate from validator")
  .action(decreaseValidatorStake);

program
  .command("update-fees")
  .description("update fees")
  .option("--mint-fee-bps <MINT_FEE_BPS>", "Mint fee bps")
  .option("--redeem-fee-bps <REDEEM_FEE_BPS>", "Redeem fee bps")
  .option("--spread-fee <SPREAD_FEE>", "Spread fee")
  .action(updateFees);

program
  .command("fetch-state")
  .description("fetch the current state of the liquid staking pool")
  .action(async () => {
    const client = new SuiClient({ url: RPC_URL });
    try {
      const state = await sdk.fetchLiquidStakingInfo(
        LIQUID_STAKING_INFO,
        client,
      );
      console.log("Current Liquid Staking State:");
      console.log(JSON.stringify(state, null, 2));
    } catch (error) {
      console.error("Error fetching state:", error);
    }
  });

program
  .command("initialize-weight-hook")
  .description("initialize weight hook")
  .action(initializeWeightHook);

function collect(pair: any, previous: any) {
  const [key, value] = pair.split("=");
  if (!value) {
    throw new Error(`Invalid format for ${pair}. Use key=value format.`);
  }
  return { ...previous, [key]: value };
}

program
  .command("set-validator-addresses-and-weights")
  .description("set validator addresses and weights")
  .option("-v, --validators <VALIDATOR_ADDRESSES...>", "Validator addresses")
  .option("-w, --weights <WEIGHTS...>", "Weights")
  .action(setValidatorAddressesAndWeights);

program
  .command("rebalance")
  .description("rebalance the validator set")
  .action(rebalance);

program.command("eject").description("eject the weight hook").action(eject);

program.parse(process.argv);
