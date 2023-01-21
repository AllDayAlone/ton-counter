import base64url from 'base64url';
import QRCode from 'qrcode';
import qs from 'qs';
import { beginCell, storeStateInit, contractAddress, toNano } from 'ton';
import { Counter } from './build/counter_Counter';
 
async function main() {
  const initialCounter = BigInt('24');
  const init = await Counter.init(initialCounter);
  
  // Contract address
  const address = contractAddress(0, init);
  
  // Amount of TONs to attach to a deploy message
  const deployAmount = toNano('0.05');
  
  // Create string representation of an init package
  const initStr = base64url(beginCell()
          .store(storeStateInit(init))
          .endCell()
          .toBoc({ idx: false }));
  
  const deployLink = `ton://transfer/${address.toString({ testOnly: true })}?${qs.stringify({
    text: 'Deploy',
    amount: deployAmount.toString(10),
    init: initStr
  })}`;
  // Create a deploy link
  console.log(deployLink);

  QRCode.toString(deployLink, { 
    type:'terminal',
    small: true
  }, function (err, url) {
    console.log(url)
  })
}

main();