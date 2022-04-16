const fs = require('fs');
const bitcore = require("bitcore-lib");

bitcore.Networks.defaultNetwork = bitcore.Networks.testnet;

/* Creates a new non-deterministic wallet with an
 * initial private key and public address pair.
 */
function createWallet() {
    if (!walletExists()) {
        createNewKeyPair(true);

        console.log("New bitcoin wallet created!");
    } else {
        console.log("Wallet already exists. To reset wallet use the reset option.")
    }
}

/* This function creates a new private key, public address pair. It takes
 * in a boolean value that is set to true if it is the first key pair being 
 * created in the wallet. Wallet key pairs are stored in the keys json file
 * within the wallet folder.
 */
function createNewKeyPair(firstKey) {
    let keyDirectory;
    if (walletExists() && !firstKey) {
        const data = fs.readFileSync(`./wallet/keys.json`,'utf-8');
        keyDirectory = JSON.parse(data);
    } else {
        keyDirectory = {};
    }

    let index = Object.keys(keyDirectory).length;

    let privateKey = new bitcore.PrivateKey();

    let address = privateKey.toAddress();

    keyDirectory[index] = {
        privateKey: privateKey,
        privateKeyWIF: privateKey.toWIF(),
        publicAddressRaw: address,
        publicAddress: address.toString()
    }

    fs.writeFileSync("./wallet/keys.json", JSON.stringify(keyDirectory), 'utf-8');

    return address.toString();
}

/* Function gets the public address at the specified wallet index argument. If the index
 * does not exist, the function will return "index out of bounds". If no index is 
 * passed in, the function returns the most recently generated public address. If
 * "new" is passed in as an argument, this function generates a new public address
 * and returns its value.
 */ 
function getAddress(_index) {
    if (!walletExists()) {
        console.log("Wallet does not exist. First create a wallet then retrieve an address.");
        return;
    }

    const data = fs.readFileSync(`./wallet/keys.json`,'utf-8');
    let keyDirectory = JSON.parse(data);

    if (!_index) {
        let index = Object.keys(keyDirectory).length - 1;
        console.log(keyDirectory[index].publicAddress);
    } else if (_index.toLowerCase() == "new") {
        let pubAddress = createNewKeyPair(false);
        console.log(pubAddress);
    } else {
        if (_index < Object.keys(keyDirectory).length) {
            console.log(keyDirectory[_index].publicAddress);
        } else {
            console.log("Index out of bounds.");
        }
    }
}

// Function checks if a wallet already exists and returns a boolean value.
function walletExists() {
    const keys = fs.readFileSync(`./wallet/keys.json`,'utf-8');
    return keys != "";
}

//Function deletes existing wallet and all associated keys
function reset() {
    fs.writeFileSync("./wallet/keys.json", "", 'utf-8');
}

/* This function constructs a bitcoin transaction and signs it. It takes in 
 * the receiver address of the bitocin transaction as well as the amount in of
 * bitocin to send in the transaction. It also takes in an optional index parameter
 * that specifies the public address the user would like to send the transaction
 * from. Note: the public address specified by the index must correspond to the address
 * that contains the UTXOs within the utxo json file. Function returns a serialized 
 * signed bitcoin transaction.
 */
function constructAndSignTx(toAddress, amount, index) {
    if (!toAddress || !amount) {
        console.log("Please enter a receiver address and bitcoin amount.");
        return;
    }

    const data = fs.readFileSync(`./wallet/keys.json`,'utf-8');
    let keyDirectory = JSON.parse(data);

    let lastIndex = Object.keys(keyDirectory).length - 1;

    if (!index || index > lastIndex) {
        index = lastIndex;
    }

    let privateKey = keyDirectory[index].privateKey;
    let pubAddress = keyDirectory[index].publicAddress;

    let utxo = fs.readFileSync('./utxo.json','utf-8');

    if (utxo == "") {
        console.log("No UTXOs present.")
        return;
    }

    utxo = JSON.parse(utxo);

    if (pubAddress != utxo[0].address) {
        console.log("Incorrect private key to sign transaction.");
        return;
    }

    const satoshiToSend = amount * 100000000;
    let fee = 0;
    let inputCount = 0;
    let outputCount = 2;

    transactionSize = inputCount * 146 + outputCount * 34 + 10 - inputCount;

    fee = transactionSize * 20;

    let transaction = new bitcore.Transaction()
    .from(utxo)
    .to(toAddress, satoshiToSend)
    .change(pubAddress)
    .fee(fee)
    .sign(privateKey);

    const serializedTransaction = transaction.serialize();

    console.log(serializedTransaction);
}

// Entry point of the "cold" application. See README.md for details.
function main() {
    let argv = process.argv.slice(2);

    switch (argv[0]) {
        case 'create-wallet':
            createWallet(argv[1]);
            break;
        case 'get-address':
            getAddress(argv[1]);
            break;
        case 'reset':
            reset();
            break;
        case 'sign-transaction':
            constructAndSignTx(argv[1], argv[2], argv[3]);
            break;
        default:
          console.log(`The function ${argv[0]} does not exist. Please try again.`);
      }
}

main();
