import { toNano } from 'ton-core';
import { JettonDefaultWallet } from '../wrappers/JettonDefaultWallet';
import { NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const jettonDefaultWallet = provider.open(await JettonDefaultWallet.fromInit());

    await jettonDefaultWallet.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(jettonDefaultWallet.address);

    // run methods on `jettonDefaultWallet`
}
