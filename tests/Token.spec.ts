//import { Content } from './../build/Token/tact_Token';
import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { beginCell, contractAddress, StateInit, toNano } from 'ton-core';
import { Mint, Token, Content } from '../wrappers/Token';
import { JettonDefaultWallet, TokenBurn, TokenTransfer } from '../wrappers/JettonDefaultWallet';
import '@ton-community/test-utils';
describe('Token', () => {
    let blockchain: Blockchain;
    let token: SandboxContract<Token>;
    let jettonWallet: SandboxContract<JettonDefaultWallet>;
    let deployer: SandboxContract<TreasuryContract>;
    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');
        const content: Content= {
            $$type: 'Content',
            name: "I Promise Token",
            symbol: "IP",
            decimals: 9n
        }
        token = blockchain.openContract(await Token.fromInit(deployer.address, content));
        const deployResult = await token.send(
            deployer.getSender(),
            {
                value: toNano('10'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );
        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: token.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and token are ready to use
        // console.log(await token.getTokenName());
        // console.log(await token.getTokenSymbol());
        // console.log(await token.getTokenDecimals());
    });

    it('should mint tokens', async () => {
        const player = await blockchain.treasury('player');
        const totalSuplyBefore = await token.getGetTotalSupply();
        const mintAmount = 10n;
        const Mint: Mint = {
            $$type: 'Mint',
            to: player.address,
            amount: mintAmount
        };
        const mintResult = await token.send(deployer.getSender(), {
            value: toNano('10'),
        },Mint);

        expect(mintResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: token.address,
            success: true,
        });

        const totalSuplyAfter = await token.getGetTotalSupply();
        expect(totalSuplyBefore + mintAmount).toEqual(totalSuplyAfter); // check that the total supply has increased by mintAmount

        const playerWallet = await token.getGetWalletAddress(player.address);
        jettonWallet = blockchain.openContract(JettonDefaultWallet.fromAddress(playerWallet));
        const walletData = await jettonWallet.getGetWalletData();
        expect(walletData.owner).toEqualAddress(player.address); // check that the wallet is owned by the player
        expect(walletData.balance).toEqual(mintAmount); // check that the wallet has mintAmount tokens
    });

    // This Burn test only decrease balance of wallet, but not decrease total supply
    it('should burn tokens', async () => {
        // mint some tokens to burn
        const player = await blockchain.treasury('player');
        const mintAmount = 1000n;
        await token.send(deployer.getSender(), {
            value: toNano('10'),
        }, {
            $$type: 'Mint',
            to: player.address,
            amount: mintAmount
        });

        const playerWalletAddress = await token.getGetWalletAddress(player.address);
        jettonWallet = blockchain.openContract(JettonDefaultWallet.fromAddress(playerWalletAddress));
        let walletData = await jettonWallet.getGetWalletData();
        expect(walletData.balance).toEqual(mintAmount); // check that the wallet has mintAmount tokens

        const burnAmount = 500n;
        const burnResult = await jettonWallet.send(player.getSender(), {
            value: toNano('10'),
        }, {
            $$type: 'TokenBurn',
            queryId: 0n, // You can set this as needed
            amount: burnAmount,
            owner: player.address,
            responseAddress: player.address, // Optional, set if needed
        });

        walletData = await jettonWallet.getGetWalletData();
        expect(walletData.balance).toEqual(mintAmount - burnAmount); // check that the wallet has mintAmount - burnAmount tokens
    });

    it('should transfer tokens', async () => {
        // Initial mint to the sender
        const sender = await blockchain.treasury('sender');
        const receiver = await blockchain.treasury('receiver');
        const initialMintAmount = 1000n;
        const transferAmount = 500n;
    
        const mintMessage: Mint = {
            $$type: 'Mint',
            amount: initialMintAmount,
            to: sender.address,
        };
        await token.send(deployer.getSender(), { value: toNano('10') }, mintMessage);
    
        const senderWalletAddress = await token.getGetWalletAddress(sender.address); // get sender's wallet
        const senderWallet = blockchain.openContract(JettonDefaultWallet.fromAddress(senderWalletAddress));
    
        // Transfer tokens from sender's wallet to receiver
        const transferMessage: TokenTransfer = {
            $$type: 'TokenTransfer',
            queryId: 1n, // or any unique identifier
            amount: transferAmount,
            destination: receiver.address,
            responseDestination: null, // or some address if needed
            customPayload: null, // or some payload if needed
            forwardTonAmount: 0n,
            forwardPayload: beginCell().endCell(), // or some payload if needed
        };
        const transferResult = await senderWallet.send(sender.getSender(), { value: toNano('10') }, transferMessage);
    
        const receiverWalletAddress = await token.getGetWalletAddress(receiver.address);
        const receiverWallet = blockchain.openContract(JettonDefaultWallet.fromAddress(receiverWalletAddress));
    
        const senderWalletDataAfterTransfer = await senderWallet.getGetWalletData();
        const receiverWalletDataAfterTransfer = await receiverWallet.getGetWalletData();
    
        expect(senderWalletDataAfterTransfer.balance).toEqual(initialMintAmount - transferAmount); // check that the sender transferred the right amount of tokens
        expect(receiverWalletDataAfterTransfer.balance).toEqual(transferAmount); // check that the receiver received the right amount of tokens
    });
    
        // This safe burn test decrease balance of wallet and total supply in the master contract
    it('should burn tokens safely', async () => {

        // mint some tokens to burn
        const player = await blockchain.treasury('player');
        const mintAmount = 1000n;
        await token.send(deployer.getSender(), {
            value: toNano('10'),
        }, {
            $$type: 'Mint',
            to: player.address,
            amount: mintAmount
        });

        // Check totalSupply in token contract before burning 
        const totalSupplyBeforeBurn = await token.getGetTotalSupply();
    
        const playerWalletAddress = await token.getGetWalletAddress(player.address);
        jettonWallet = blockchain.openContract(JettonDefaultWallet.fromAddress(playerWalletAddress));
        let walletData = await jettonWallet.getGetWalletData();
        expect(walletData.balance).toEqual(mintAmount); // check that the wallet has mintAmount tokens
    
        const burnAmount = 500n;
    
        // Player sends TokenBurn to token contract
        const burnResult = await token.send(player.getSender(), {
            value: toNano('10'),
        }, {
            $$type: 'TokenBurn',
            queryId: 0n, // You can set this as needed
            amount: burnAmount,
            owner: player.address,
            responseAddress: playerWalletAddress, // This should be the wallet contract address to notify it about the burn
        });
    
        // Wait for the token contract to process the burn and send back the TokenBurnConfirmation to the wallet
        // This step might require some delay or a mechanism to wait for the confirmation message
        // For the sake of this example, I'm using a simple delay
        await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 seconds delay
    
        // Check totalSupply in token contract after burning
        const totalSupplyAfterBurn = await token.getGetTotalSupply();
        expect(totalSupplyAfterBurn).toEqual(totalSupplyBeforeBurn - burnAmount);
    
        // Check the balance in the wallet contract after receiving the TokenBurnConfirmation
        walletData = await jettonWallet.getGetWalletData();
        expect(walletData.balance).toEqual(mintAmount - burnAmount); // check that the wallet has mintAmount - burnAmount tokens
    });
    
});

