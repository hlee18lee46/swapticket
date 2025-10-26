module ticket_bridge::bridge {
    use sui::object;
    use sui::event;
    use sui::tx_context::TxContext;
    use ticket::ticket::Ticket; // imported from your main package

    struct BridgeOutEvent has copy, drop {
        sui_object_id: address,
        eth_recipient: address,
        token_uri: String,
        nonce: u64,
    }

    public entry fun request_bridge_out(
        t: Ticket,
        eth_recipient: address,
        token_uri: String,
        nonce: u64,
        ctx: &mut TxContext
    ) {
        let id_addr = object::id(&t.id);
        object::delete(t.id);
        event::emit(BridgeOutEvent {
            sui_object_id: id_addr,
            eth_recipient,
            token_uri,
            nonce,
        });
    }
}