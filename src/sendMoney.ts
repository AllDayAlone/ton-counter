import { TonClient, WalletContractV4, internal, Address, toNano } from "ton";
import { mnemonicToPrivateKey } from "ton-crypto";
import env from './env';

async function main() {
  const client = new TonClient({
    endpoint: env.toncenter.endpoint,
    apiKey: env.toncenter.apiKey,
  });

  const keyPair = await mnemonicToPrivateKey(env.deployer.mnemonic);
  const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
  const walletContract = client.open(wallet);

  const balance = await walletContract.getBalance();
  
  // Transfer inputs
  const receiverAddress = Address.parse('EQAtGG3oRRReCuHYJHYAgOy8JXBRGKtL_rTSRuFFyRkGhlfl');
  const txAmount = toNano('0.06');
  const txMessage = 'From the bottom of my heart';

  const seqno = await walletContract.getSeqno();
  const transfer = walletContract.createTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    messages: [internal({
      value: txAmount,
      to: receiverAddress,
      body: txMessage,
    })]
  });

  walletContract.send(transfer);

  console.log(`Sent ${txAmount} TON to ${receiverAddress} with message: "${txMessage}"`, { 
    address: wallet.address,
    balance,
  });
}

main();