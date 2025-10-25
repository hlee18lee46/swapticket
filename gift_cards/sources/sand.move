module gift_cards::sand {
    use std::option;
    use sui::coin;
    use sui::tx_context::{sender, TxContext};
    use sui::transfer;

    // One-time witness for SAND
    struct SAND has drop {}

    #[allow(deprecated_usage)]
    fun init(witness: SAND, ctx: &mut TxContext) {
        let (tcap, metadata) = coin::create_currency<SAND>(
            witness,
            2u8,                       // decimals
            b"SAND",                   // symbol
            b"Sandwich Gift Card",     // name
            b"Sandwich stored-value",  // description
            option::none(),
            ctx
        );
        transfer::public_transfer(tcap, sender(ctx));
        transfer::public_share_object(metadata);
    }

    public fun mint_and_transfer_sand(
        tcap: &mut coin::TreasuryCap<SAND>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext,
    ) {
        let c = coin::mint<SAND>(tcap, amount, ctx);
        transfer::public_transfer(c, recipient);
    }
}