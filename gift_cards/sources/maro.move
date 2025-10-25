module gift_cards::maro {
    use std::option;
    use sui::coin;
    use sui::tx_context::{TxContext, sender};
    use sui::transfer;

    struct MARO has drop {}

    #[allow(deprecated_usage)]
    fun init(w: MARO, ctx: &mut TxContext) {
        let (tcap, meta) = coin::create_currency<MARO>(
            w, 0u8, b"MARO",
            b"Maroon5 Reward",
            b"Redeemed by using a Maroon5 ticket",
            option::none(), ctx
        );
        transfer::public_transfer(tcap, sender(ctx));
        transfer::public_share_object(meta);
    }

    public entry fun mint_and_transfer_maro(
        tcap: &mut coin::TreasuryCap<MARO>,
        amount: u64,
        to: address,
        ctx: &mut TxContext
    ) {
        let c = coin::mint<MARO>(tcap, amount, ctx);
        transfer::public_transfer(c, to);
    }
}