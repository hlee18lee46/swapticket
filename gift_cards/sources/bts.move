module gift_cards::bts {
    use std::option;
    use sui::coin;
    use sui::tx_context::{TxContext, sender};
    use sui::transfer;

    struct BTS has drop {}

    #[allow(deprecated_usage)]
    fun init(w: BTS, ctx: &mut TxContext) {
        let (tcap, meta) = coin::create_currency<BTS>(
            w, 0u8, b"BTS",
            b"BTS Reward",
            b"Redeemed by using a BTS ticket",
            option::none(), ctx
        );
        transfer::public_transfer(tcap, sender(ctx));
        transfer::public_share_object(meta);
    }

    public entry fun mint_and_transfer_bts(
        tcap: &mut coin::TreasuryCap<BTS>,
        amount: u64,
        to: address,
        ctx: &mut TxContext
    ) {
        let c = coin::mint<BTS>(tcap, amount, ctx);
        transfer::public_transfer(c, to);
    }
}