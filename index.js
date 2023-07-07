// Import Solana web3 functionalities
const {
    Connection,
    PublicKey,
    clusterApiUrl,
    Keypair,
    LAMPORTS_PER_SOL,
    Transaction,
    SystemProgram,
    sendAndConfirmRawTransaction,
    sendAndConfirmTransaction
} = require("@solana/web3.js");

const MY_FROM_SECRET_KEY = new Uint8Array(
    [
        163,221,110,84,118,38,21,4,93,85,187,143,30,226,30,82,113,145,119,113,161,124,18,217,4,11,166,109,39,88,227,3,110,150,103,173,161,111,226,195,120,160,144,10,230,134,87,87,67,0,31,199,79,147,235,26,173,135,22,106,97,145,15,242
    ]
);

// Get the wallet balance from a given private key
const getWalletBalance = async (chosenPublicKey = "") => {
    try {
        // Connect to the Devnet
        const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
        // console.log("Connection object is:", connection);

        if (chosenPublicKey.length>1) {
            // Make a wallet (keypair) from privateKey and get its balance
            const walletBalance = await connection.getBalance(
                new PublicKey(chosenPublicKey)
            );
            console.log(`Balance of ${chosenPublicKey} : ${parseInt(walletBalance) / LAMPORTS_PER_SOL} SOL`);
            return parseInt(walletBalance)
        }
    } catch (err) {
        console.log(err);
    }
};

async function initFundedWallet() {
    // check if wallet exists in .env
    if (getEnvValue("publicKey")) {
        console.log("Found existing publicKey in .env\nAborting initFundedWallet()")
        return
    }

    const newPair = Keypair.generate()
    console.log(newPair)
    await airDropSol(newPair.publicKey.toString())

    console.log(`setting publicKey: ${newPair.publicKey.toString()}`)
    setEnvValue("publicKey", newPair.publicKey.toString())
    console.log(`setting secretKey: ${newPair.secretKey.toString()}`)
    setEnvValue("secretKey", newPair.secretKey.toString())

    async function airDropSol(chosenPublicKey = "") {
        if (chosenPublicKey.length===0) {
            console.error("airDropSol requires a publicKey as input")
            return
        }

        try {
            // Connect to the Devnet
            const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
            // Airdrop to user specified wallet
            console.log("Airdropping some SOL to my wallet!");
            const fromAirDropSignature = await connection.requestAirdrop(
                new PublicKey(chosenPublicKey),
                2 * LAMPORTS_PER_SOL
            );
            await connection.confirmTransaction(fromAirDropSignature);
        } catch (err) {
            console.log(err);
        }
    }
}

const transferSol = async() => {
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    // Get Keypair from Secret Key
    var from = Keypair.fromSecretKey(MY_FROM_SECRET_KEY);
    let from_balance = await getWalletBalance(from.publicKey.toString())

    // Generate another Keypair (account we'll be sending to)
    const to = Keypair.generate();
    const to_balance_before = await getWalletBalance(to.publicKey.toString())

    // calc outgoing LAMPORTS
    console.log(`${from.publicKey} has ${from_balance} LAMPORTS`)
    const half_of_fromBalance = Math.floor(from_balance/2)
    console.log(`Trying to send ${half_of_fromBalance} LAMPORTS to ${to.publicKey}`)

    // Send money from "from" wallet and into "to" wallet
    var transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: from.publicKey,
            toPubkey: to.publicKey,
            lamports: half_of_fromBalance
        })
    );

    // Sign transaction
    var signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [from]
    );
    console.log('Transaction completed. Signature is ', signature);
    // confirm balance change
    const to_balance_after = await getWalletBalance(to.publicKey.toString())
}

async function main() {
    await transferSol()
}

main()
