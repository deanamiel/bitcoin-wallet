# Overview

This application simulates a bitcoin cold storage application and is broken down into two components: the "cold" portion of the application and the "hot" portion of the application. The "cold" portion of the application generates and stores private keys and their corresponding public addresses. The "cold" portion of the application also constructs and signs transactions with the private key specified by the user. The "hot" portion of the application handles the networking component of the application which enables it to retrieve public address balances and UTXOs and also propagate signed transactions to the bitcoin testnet.

# Cold Wallet Architecture

The cold wallet implements a simple JBOK bitcoin wallet in which an arbitrary amount of private key - public key pairs can be generated with no relation to one another. Private keys and public addresses are stored in a separate file called keys.json located in the wallet folder. The cold wallet also reads in UTXOs that are stored in the utxo.json file in the root directory (these UTXOs pertain to a specific public address) and constructs transactions based on these UTXOs as inputs. The wallet then signs these transactions and returns them in serialized form.

Cold Wallet CLI Command Guide:

node cold.js create-wallet

This command is used to create a new wallet and instantiate the first private key - public address pair.

node cold.js get-address [index or "new" (optional)]

This command returns the most recently generated public address (if index is not provided). If index is provided it returns the public address at the index provided in the keys.json file. If "new" is provided, this command generates a new private-key - public address pair and returns the newly generated address.

node cold.js reset

This command deletes the existing wallet and all associated keys.

node cold.js sign-transaction [receiver address] [amount] [index (optional)]

This command constructs and signs a bitcoin transaction to the receiver address with the specified amount. If index is not provided, the transaction is constructed with the most recently created public address as the from address, otherwise, it is constructed from the from address specified by the index. NOTE: The from address must match the address corresponding to the UTXOs generated from the "hot" portion of the application and stored in utxo.json or else this command will fail. This command returns the serialized signed transaction.

# Hot Application Architecture

The "hot" portion of the application handles all the networking components of the wallet. It can be used to retrieve the balance associated with a public address, retrieve all the UTXOs corresponding to a public address, and transmit a signed transaction to the bitcoin testnet. After UTXOs are retrieved for a public address, they are stored in the utxo.json file to be used by the cold wallet in constructing and signing transactions.

Hot Application CLI Command Guide:

node hot.js get-balance [public address]

This command returns the balance associated with the specified public address. This is done by summing up the values of all the UTXOs with at least one network confirmation associated with the address.

node hot.js get-utxos [public address]

This command returns all the UTXOs associated with the specified address (with at least one network confirmation) and writes them to the utxo.json file to be used by the cold wallet.

node hot.js send-transaction [serialized transaction]

This command transmits the serialized transaction to the bitcoin testnet and returns the transaction ID which can be used to track the transaction on the bitcoin testnet block explorer.

# Installing and Running the Application

To use this application, simply clone this repository and run "npm install" in the root directory to install all required libraries. Run all the commands above from the root directory of the application.

# Sending a Transaction: Step-By-Step Guide

1. Run "node cold.js create-wallet" from the root directory
2. Run "node cold.js get-address" to retrieve the public address generated.
3. Use a bitcoin testnet faucet to send bitcoin to the public address from step 2.
4. After 10-15 minutes, verify that the transaction in step 3 has been confirmed.
5. Run "node hot.js get-balance [step 2 address]" to verify that the address has a nonzero balance.
6. Run "node hot.js get-utxos [step 2 address]" to write the UTXOs (there should only be 1 at this point) to the utxo.json file.
7. Run "node cold.js sign-transaction [receiver address] [amount]" with a specified receiver address and amount (amount must be less than the public address balance of the transaction will fail). A serialized signed transaction will be printed to the console as a hexadecimal number. Copy this number.
8. Run "node hot.js send-transaction [output from step 7]" to transmit the transaction to the bitcoin testnet. This step should return a JSON object with the transaction ID that can be used to track the status of the transaction on a bitcoin testnet explorer.





