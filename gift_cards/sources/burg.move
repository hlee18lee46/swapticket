module gift_cards::burg {
    use std::option;
    use sui::coin;
    use sui::tx_context::{TxContext, sender};
    use sui::transfer;

    // One-time witness for the BURG currency
    struct BURG has drop {}

    #[allow(deprecated_usage)]
    fun init(witness: BURG, ctx: &mut TxContext) {
        let (tcap, metadata) = coin::create_currency<BURG>(
            witness,                 // OTW
            2u8,                     // decimals
            b"BURG",                 // symbol
            b"Burger King Gift Card",// name
            b"BK stored-value card", // description
            option::none(),          // icon URL (Option<Url>)
            ctx
        );
        // hand out the capabilities
        transfer::public_transfer(tcap, sender(ctx));
        transfer::public_share_object(metadata);
    }

    /// Simple mint helper
    public entry fun mint_and_transfer_burg(
        tcap: &mut coin::TreasuryCap<BURG>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let c = coin::mint<BURG>(tcap, amount, ctx);
        transfer::public_transfer(c, recipient);
    }
}