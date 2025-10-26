module sui_bridge_contract::bridge {
    use sui::event;
    use sui::tx_context::TxContext;

    struct BridgeRequest has copy, drop {
        sui_nft_id: address,
        eth_recipient: address,
        metadata_uri: String,
        nonce: u64,
    }

    public entry fun bridge_to_eth(
        sui_nft_id: address,
        eth_recipient: address,
        metadata_uri: String,
        nonce: u64,
        _ctx: &mut TxContext
    ) {
        event::emit(BridgeRequest {
            sui_nft_id,
            eth_recipient,
            metadata_uri,
            nonce,
        });
    }
}