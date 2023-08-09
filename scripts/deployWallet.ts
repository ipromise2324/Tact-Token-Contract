import { toNano } from 'ton-core';
import { Wallet } from '../wrappers/Wallet';
import { NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const wallet = provider.open(await Wallet.fromInit());

    await wallet.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(wallet.address);

    // run methods on `wallet`
}
