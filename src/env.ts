import { config } from 'dotenv'
import { get } from 'env-var';

config();

const env = {
  deployer: {
    mnemonic: get('DEPLOYER_MNEMONIC').required().asArray(' '),
    address: get('DEPLOYER_ADDRESS').required().asString(),
  },
  toncenter: {
    endpoint: get('TONCENTER_ENDPOINT').default('https://testnet.toncenter.com/api/v2/jsonRPC').asUrlString(),
    apiKey: get('TONCENTER_API_KEY').required().asString(),
  },
}

export default env;