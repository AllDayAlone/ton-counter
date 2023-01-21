import { TonClient, WalletContractV4, internal, beginCell, Address, toNano, ContractProvider, TupleItem, contractAddress, Cell, ContractState, Sender, SendMode } from "ton";
import { KeyPair, mnemonicToPrivateKey } from "ton-crypto";
import { Counter } from './build/counter_Counter';
import env from '../env';
import { Maybe } from "ton-core/dist/utils/maybe";

class MyContractProvider implements ContractProvider {
  constructor (public client: TonClient, public address: Address, public keyPair: KeyPair, public wallet: WalletContractV4) {}
  getState(): Promise<ContractState> {
    throw new Error("Method not implemented.");
  }
  external(message: Cell): Promise<void> {
    throw new Error("Method not implemented.");
  }
  internal(via: Sender, args: { value: string | bigint; bounce?: Maybe<boolean>; sendMode?: SendMode | undefined; body?: Maybe<string | Cell>; }): Promise<void> {
    throw new Error("Method not implemented.");
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
  async get(name: string, args: TupleItem[]) {
    const { stack } = await this.client.callGetMethod(this.address, name, args);

    return { stack };
  }
  // external() {

  // }
  // internal() {}
}

async function main() {
  const contractAddress = Address.parse('EQDwSEnT6DMcWb5bCpb3_Ln2NEyXLuv_vOXkWpDY9_5rNLow')
  const counterContract = Counter.fromAddress(contractAddress);
  const client = new TonClient({
    endpoint: env.toncenter.endpoint,
    apiKey: env.toncenter.apiKey,
  });

  const keyPair = await mnemonicToPrivateKey(env.deployer.mnemonic);
  
  const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });

  const contracProvider = new MyContractProvider(client, contractAddress, keyPair, wallet);

  const counterValue = await counterContract.getCounter(contracProvider);

  console.log(`Counter equals ${counterValue}`);

  // console.log(transfer);
  // console.log('Transfer was not sent (uncomment)');
  // walletContract.send(transfer);
}

main();