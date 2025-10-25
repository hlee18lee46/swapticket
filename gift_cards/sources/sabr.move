module gift_cards::sabr {
    use std::option;
    use sui::coin;
    use sui::tx_context::{TxContext, sender};
    use sui::transfer;

    struct SABR has drop {}

    #[allow(deprecated_usage)]
    fun init(w: SABR, ctx: &mut TxContext) {
        let (tcap, meta) = coin::create_currency<SABR>(
            w,
            0u8,                 // decimals (0 if you want 1 ticket -> 1 coin)
            b"SABR",
            b"Sabrina Carpenter Reward",
            b"Redeemed by using a Sabrina ticket",
            option::none(),
            ctx
        );
        transfer::public_transfer(tcap, sender(ctx));
        transfer::public_share_object(meta);
    }

    public entry fun mint_and_transfer_sabr(
        tcap: &mut coin::TreasuryCap<SABR>,
        amount: u64,
        to: address,
        ctx: &mut TxContext
    ) {
        let c = coin::mint<SABR>(tcap, amount, ctx);
        transfer::public_transfer(c, to);
    }
}