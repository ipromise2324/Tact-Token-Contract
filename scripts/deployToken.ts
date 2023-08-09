import { toNano } from 'ton-core';
import { Token } from '../wrappers/Token';
import { NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const token = provider.open(await Token.fromInit());

    await token.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(token.address);

    // run methods on `token`
}
