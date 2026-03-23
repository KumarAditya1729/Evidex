const { Keyring } = require('@polkadot/api');
const { cryptoWaitReady } = require('@polkadot/util-crypto');

async function main() {
  await cryptoWaitReady();
  const mnemonic = "bottom drive obey lake curtain smoke basket hold race lonely fit walk";
  const keyring = new Keyring({ type: 'sr25519' });
  const pair = keyring.addFromUri(mnemonic);
  console.log("ADDRESS=" + pair.address);
}

main().catch(console.error);
