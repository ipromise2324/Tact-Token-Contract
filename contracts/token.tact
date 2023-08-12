import "@stdlib/deploy";
import "@stdlib/ownable";
import "./messages";
import "./jetton_default_wallet";
message Mint {
    to: Address;
    amount: Int;
}

struct Content {
    name: String;
    symbol: String;
    decimals: Int;
}

contract Token with Deployable, Ownable {
    totalSupply: Int as coins;
    owner: Address;
    content: Content;
    mintables: Bool;

    init(owner: Address, content: Content) {
        self.totalSupply = 0;
        self.owner = owner;
        self.content = content;
        self.mintables = true;
    }

    receive(msg: Mint) {
        self.requireOwner(); // Only owner can mint
        self.mint(msg.to, msg.amount, msg.to);
    }

    receive(msg: SafeTokenBurn) {
        require(self.totalSupply - msg.amount >= 0, "Invalid total supply after burn");
        self.burn(msg.amount, msg.owner, msg.queryId);

    }
    //
    // Private Methods
    //

    fun mint(to: Address, amount: Int, responseAddress: Address?) {

        // Update total supply
        self.totalSupply = self.totalSupply + amount;

        // Create message
        let winit: StateInit = self.getJettonWalletInit(to);
        let walletAddress: Address = contractAddress(winit);
        send(SendParameters{
            to: walletAddress, 
            value: 0, 
            bounce: false,
            mode: SendRemainingValue,
            body: TokenTransferInternal{ 
                amount: amount,
                queryId: 0,
                from: myAddress(),
                responseAddress: responseAddress,
                forwardTonAmount: 0,
                forwardPayload: emptySlice()
            }.toCell(),
            code: winit.code,
            data: winit.data
        });
    }

    fun burn(burnAmount: Int, to: Address, queryId: Int) {
        // Update total supply
        self.totalSupply = self.totalSupply - burnAmount;
        //Create message
        let winit: StateInit = self.getJettonWalletInit(to);
        let walletAddress: Address = contractAddress(winit);
        // Send a confirmation back to the wallet to finalize the burn
        send(SendParameters{
            to: walletAddress,
            value: 0,
            bounce: false,
            mode: SendRemainingValue,
            body: TokenBurnConfirmation{
                queryId: queryId,
                amount: burnAmount
            }.toCell(),
            code: winit.code,
            data: winit.data
        });
    } 

    // Get Methods
    get fun getWalletAddress(owner: Address): Address
    {
        let winit: StateInit = self.getJettonWalletInit(owner);
        return contractAddress(winit);
    }

    get fun getJettonWalletInit(address: Address): StateInit {
        return initOf JettonDefaultWallet(myAddress(), address);
    }

    get fun getTotalSupply(): Int {
        return self.totalSupply;
    }

    // Token Content
    get fun tokenName(): String {
        return self.content.name;
    }

    get fun tokenSymbol(): String {
        return self.content.symbol;
    }

    get fun tokenDecimals(): Int {
        return self.content.decimals;
    }
}
