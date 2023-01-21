import { TonClient, Cell, WalletContractV4, internal, beginCell, contractAddress, SendMode, toNano } from "ton";
import { mnemonicToPrivateKey } from "ton-crypto";
import fs from 'node:fs';
import env from './env';

async function main() {
  const client = new TonClient({
    endpoint: env.toncenter.endpoint,
    apiKey: env.toncenter.apiKey,
  });

  const keyPair = await mnemonicToPrivateKey(env.deployer.mnemonic);
  
  const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
  const walletContract = client.open(wallet);


  // Deploy inputs
  const pathToCode = './src/build/counter.boc';
  const initialCounter = 24;

  const seqno = await walletContract.getSeqno();
  const transfer = walletContract.createTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    sendMode: SendMode.PAY_GAS_SEPARATLY + SendMode.IGNORE_ERRORS,
    messages: [buildDeployMessage(pathToCode, initialCounter)]
  });

  walletContract.send(transfer);
}

function buildDeployMessage(pathToCode: string, initialCounter: number) {
  const code = Cell.fromBoc(fs.readFileSync(pathToCode))[0];
  const data = beginCell().storeUint(initialCounter, 64).endCell();
  const init = { code, data };
  const to = contractAddress(0, init);

  console.log(`Contract address: ${to}`);

  return internal({
    value: toNano('0.005'),
    to,
    bounce: false,
    init,
  })
}

main();