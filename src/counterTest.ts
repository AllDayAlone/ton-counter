import { TonClient, WalletContractV4, internal, beginCell, Address, toNano } from "ton";
import { mnemonicToPrivateKey } from "ton-crypto";
import env from './env';

class CounterContract {
  address: Address;

  constructor(address: string | Address) {
    if (typeof address === 'string') {
      this.address = Address.parse(address);
    } else {
      this.address = address;
    }
  }

  async getTotal(client: TonClient) {
    const { stack, gas_used: gasUsed} = await client.callGetMethod(this.address, 'get_total');

    console.log('get_total', { gasUsed });

    return stack.readNumber();
  }

  buildAddMessage(addToCounter: number) {
    return internal({
      value: toNano('0.001'),
      to: this.address,
      body: beginCell().storeUint(addToCounter, 32).endCell(),
    })
  }
}

async function main() {
  const counterContract = new CounterContract('EQCOJPrATG2wTaqnDTVkJP-B_T29uDyLpjJ9nQK8BzGDE-1f');
  const client = new TonClient({
    endpoint: env.toncenter.endpoint,
    apiKey: env.toncenter.apiKey,
  });

  const counterTotal = await counterContract.getTotal(client);

  console.log(`Counter equals ${counterTotal}`);

  const keyPair = await mnemonicToPrivateKey(env.deployer.mnemonic);
  
  const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
  const walletContract = client.open(wallet);

  // Add inputs
  const addToCounter = 24;

  const seqno: number = await walletContract.getSeqno();
  const transfer = walletContract.createTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    messages: [counterContract.buildAddMessage(addToCounter)],
  });

  console.log(transfer);
  console.log('Transfer was not sent (uncomment)');
  // walletContract.send(transfer);
}

main();