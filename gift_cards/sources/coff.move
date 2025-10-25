module gift_cards::coff {
    use std::option;
    use sui::coin;
    use sui::tx_context::{sender, TxContext};
    use sui::transfer;

    // One-time witness for COFF
    struct COFF has drop {}

    #[allow(deprecated_usage)]
    fun init(witness: COFF, ctx: &mut TxContext) {
        let (tcap, metadata) = coin::create_currency<COFF>(
            witness,
            2u8,
            b"COFF",
            b"Coffee Gift Card",
            b"Coffee stored-value",
            option::none(),
            ctx
        );
        transfer::public_transfer(tcap, sender(ctx));
        transfer::public_share_object(metadata);
    }

    public fun mint_and_transfer_coff(
        tcap: &mut coin::TreasuryCap<COFF>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext,
    ) {
        let c = coin::mint<COFF>(tcap, amount, ctx);
        transfer::public_transfer(c, recipient);
    }
}