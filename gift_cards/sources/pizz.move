module gift_cards::pizz {
    use std::option;
    use sui::coin;
    use sui::tx_context::{sender, TxContext};
    use sui::transfer;

    // One-time witness for PIZZ
    struct PIZZ has drop {}

    #[allow(deprecated_usage)]
    fun init(witness: PIZZ, ctx: &mut TxContext) {
        let (tcap, metadata) = coin::create_currency<PIZZ>(
            witness,
            2u8,
            b"PIZZ",
            b"Pizza Gift Card",
            b"Pizza stored-value",
            option::none(),
            ctx
        );
        transfer::public_transfer(tcap, sender(ctx));
        transfer::public_share_object(metadata);
    }

    public fun mint_and_transfer_pizz(
        tcap: &mut coin::TreasuryCap<PIZZ>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext,
    ) {
        let c = coin::mint<PIZZ>(tcap, amount, ctx);
        transfer::public_transfer(c, recipient);
    }
}