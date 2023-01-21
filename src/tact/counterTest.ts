import { TonClient, WalletContractV4, internal, beginCell, Address, toNano,SenderArguments, ContractProvider, TupleItem, contractAddress, Cell, ContractState, Sender, SendMode } from "ton";
import { KeyPair, mnemonicToPrivateKey } from "ton-crypto";
import { Counter } from './build/counter_Counter';
import env from '../env';
import { Maybe } from "ton-core/dist/utils/maybe";

class MyContractProvider implements ContractProvider {
  constructor (public client: TonClient, public address: Address) {}
  getState(): Promise<ContractState> {
    throw new Error("Method not implemented.");
  }
  async get(name: string, args: TupleItem[]) {
    const { stack } = await this.client.callGetMethod(this.address, name, args);

    return { stack };
  }
  external(message: Cell): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async internal(via: Sender, args: { value: string | bigint; bounce?: Maybe<boolean>; sendMode?: SendMode | undefined; body?: Maybe<string | Cell>; }): Promise<void> {
    await via.send({
      value: BigInt(args.value),
      to: this.address,
      sendMode: args.sendMode,
      bounce: args.bounce,
      body: args.body as unknown as Maybe<Cell>
    })
  }
}

  class MySender implements Sender {
    readonly address?: Address;

    constructor(public client: TonClient, public keyPair: KeyPair, public wallet: WalletContractV4) {
      this.address = wallet.address;
    }
    async send(args: SenderArguments): Promise<void> {
      const walletContract = this.client.open(this.wallet);
    
      const seqno = await walletContract.getSeqno();
      const message = {
        value: args.value,
        to: args.to,
        body: args.body,
      }
      const transferParams = {
        seqno,
        secretKey: this.keyPair.secretKey,
        sendMode: args.sendMode,
        messages: [internal(message)]
      }
      console.log({ transferParams, message })
      const transfer = walletContract.createTransfer(transferParams);

      console.log(transfer);
    
      walletContract.send(transfer);
    }

  }

  // async getState() {
  //   const { balance, lastTransaction: last, state: stateType, code, data } = await this.client.getContractState(this.address);
  //   let state;

  //   if (stateType === 'uninitialized') {
  //     state = { type: 'unint' as const };
  //   } else if (stateType === 'active') {
  //     state = { type: 'active' as const, code, data };
  //   } else if (stateType === 'frozen') {
  //     state = { type: 'frozen' as const, stateHash: Buffer.from("") }; // ??
  //   }

  //   return {
  //     balance,
  //     last: last ? {
  //       lt: toNano(last.lt),
  //       hash: Buffer.from(last.hash),
  //     } : null,
  //     state: state as NonNullable<typeof state>
  //   }
  // }
  // async get(name: string, args: TupleItem[]) {
  //   const { stack } = await this.client.callGetMethod(this.address, name, args);

  //   return { stack };
  // }
  // external() {

  // }
  // internal() {}
// }

async function main() {
  // const contractAddress = Address.parse('EQDwSEnT6DMcWb5bCpb3_Ln2NEyXLuv_vOXkWpDY9_5rNLow') // with tact deploy
  // const contractAddress = Address.parse('EQDTcssUQ4V9tKCkLqC2gKwZ9WwR3ejrk5o8GLrJXOcUQfjJ') // with common deploy
  const contractAddress = Address.parse('EQBKLyrHfl8MDLtHM1PwEi0t5Gj5yKiHmC3Dm2xphbzMvKwU') // with tact deploy and link click
  
  const counterContract = Counter.fromAddress(contractAddress);
  const client = new TonClient({
    endpoint: env.toncenter.endpoint,
    apiKey: env.toncenter.apiKey,
  });

  const keyPair = await mnemonicToPrivateKey(env.deployer.mnemonic);
  
  const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });

  const contractProvider = new MyContractProvider(client, contractAddress);

  const counterValue = await counterContract.getCounter(contractProvider);

  console.log(`Counter equals ${counterValue}`);

  const sender = new MySender(client, keyPair, wallet);
  await counterContract.send(contractProvider, sender, {
    value: toNano('0.05'),
  }, {
    $$type: 'AddMessage',
    amount: BigInt(24),
  });

  // console.log(transfer);
  // console.log('Transfer was not sent (uncomment)');
  // walletContract.send(transfer);
}

main();