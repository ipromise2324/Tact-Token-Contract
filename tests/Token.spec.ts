//import { Content } from './../build/Token/tact_Token';
import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { beginCell, contractAddress, StateInit, toNano } from 'ton-core';
import { Mint, Token, Content } from '../wrappers/Token';
import { JettonDefaultWallet, TokenBurn } from '../wrappers/JettonDefaultWallet';
import '@ton-community/test-utils';
describe('Token', () => {
    let blockchain: Blockchain;
    let token: SandboxContract<Token>;
    let jettonWallet: SandboxContract<JettonDefaultWallet>;
    beforeEach(async () => {
        blockchain = await Blockchain.create();

        const deployer = await blockchain.treasury('deployer');
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

    it('should mint', async () => {
        const totalSuplyBefore = await token.getGetTotalSupply();
        const mintAmount = 10n;
        const Mint: Mint = {
            $$type: 'Mint',
            amount: mintAmount,
        };
        const player = await blockchain.treasury('player');
        const mintResult = await token.send(player.getSender(), {
            value: toNano('10'),
        },Mint);

        expect(mintResult.transactions).toHaveTransaction({
            from: player.address,
            to: token.address,
            success: true,
        });

        const totalSuplyAfter = await token.getGetTotalSupply();
        expect(totalSuplyBefore + mintAmount).toEqual(totalSuplyAfter); // check that the total supply has increased by 1

        const playerWallet = await token.getGetWalletAddress(player.address);
        jettonWallet = blockchain.openContract(JettonDefaultWallet.fromAddress(playerWallet));
        const walletData = await jettonWallet.getGetWalletData();
        expect(walletData.owner).toEqualAddress(player.address); // check that the wallet is owned by the player
        expect(walletData.balance).toEqual(mintAmount); // check that the wallet has 1 token
    });

    it('should burn tokens', async () => {
        // 1. First, we need to mint some tokens to burn later
        const player = await blockchain.treasury('player');
        const mintAmount = 1000n;
        await token.send(player.getSender(), {
            value: toNano('10'),
        }, {
            $$type: 'Mint',
            amount: mintAmount,
        });

        // 2. Confirm that the tokens were minted
        const playerWalletAddress = await token.getGetWalletAddress(player.address);
        jettonWallet = blockchain.openContract(JettonDefaultWallet.fromAddress(playerWalletAddress));
        let walletData = await jettonWallet.getGetWalletData();
        expect(walletData.balance).toEqual(mintAmount);

        // 3. Burn the tokens
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

        // 4. Confirm that the tokens were burned
        walletData = await jettonWallet.getGetWalletData();
        expect(walletData.balance).toEqual(mintAmount - burnAmount);
    });
});
