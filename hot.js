const axios = require("axios");
const dotenv = require('dotenv').config();
const fs = require('fs');

const network = process.env.NETWORK;
const urlReceive = process.env.NODE_URL_RECEIVE;
const urlSend = process.env.NODE_URL_SEND;

/* Function returns the balance of a bitcoin public address by summing up the values
 * of all the UTXOs pertaining to the public address.
 */
async function getBalance(pubAddress) {
    if (!pubAddress) {
        console.log("Please provide public address.")
        return 0;
    }

    let utxos;
    try {
        utxos = await axios.get(
            `${urlReceive}/${network}/${pubAddress}`
        );
    } catch (error) {
        console.log(`Request error: ${error}`);
        return 0;
    }

    let txArray = utxos.data.data.txs;
    let balance = 0;

    for (let tx of txArray) {
        if (tx.confirmations > 0) {
            balance += parseFloat(tx.value);
        }
    }

    console.log(`Balance: ${balance}`);

    return balance;
}

/* Function gets all the UTXOs pertaining to the public address parameter. These
 * UTXOs are written to the utxo json file and are later used to construct and sign
 * the transaction by the cold wallet portion of the application. If the public address
 * parameter has not UTXOs associated with it, then nothing is written to the utxo
 * json file.
 */
async function getUTXOs(pubAddress) {
    if (!pubAddress) {
        console.log("Please provide public address.")
        return null;
    }

    let utxos;
    try {
        utxos = await axios.get(
            `${urlReceive}/${network}/${pubAddress}`
        );
    } catch (error) {
        console.log(`Request error: ${error}`);
        return null;
    }

    let inputs = [];
    utxos.data.data.txs.forEach(async (element) => {
        let utxo = {};
        if (element.confirmations > 0) {
            utxo.satoshis = Math.floor(Number(element.value) * 100000000);
            utxo.script = element.script_hex;
            utxo.address = pubAddress;
            utxo.txId = element.txid;
            utxo.outputIndex = element.output_no;

            inputs.push(utxo);
        }
    });

    if (inputs.length != 0) {
        fs.writeFileSync('./utxo.json', JSON.stringify(inputs), 'utf-8');

        console.log(inputs);
    } else {
        console.log("There are no confirmed UTXOs for this address.")
    }
}

/* Function takes in a serialized signed bitcoin transaction and propagates it to
 * the bitcoin testnet.
 */
async function sendSignedTransaction(serializedTX) {
    let result;
    try {
        result = await axios({
            method: "POST",
            url: `${urlSend}/${network}`,
            data: {
              tx_hex: serializedTX,
            },
        });
    } catch (error) {
        console.log(`Error sending transaction: ${error}`);
        return null;
    }

    console.log(result.data.data);
    
    return result.data.data;
}

// Entry point of the "hot" application. See README.md for more details.
function main() {
    let argv = process.argv.slice(2);

    switch (argv[0]) {
        case 'get-balance':
            getBalance(argv[1]);
            break;
        case 'get-utxos':
            getUTXOs(argv[1]);
            break;
        case 'send-transaction':
            sendSignedTransaction(argv[1]);
            break;
        default:
          console.log(`The function ${argv[0]} does not exist. Please try again.`);
      }
}

main();