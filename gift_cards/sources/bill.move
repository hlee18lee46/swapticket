module gift_cards::bill {
    use std::option;
    use sui::coin;
    use sui::tx_context::{TxContext, sender};
    use sui::transfer;

    struct BILL has drop {}

    #[allow(deprecated_usage)]
    fun init(w: BILL, ctx: &mut TxContext) {
        let (tcap, meta) = coin::create_currency<BILL>(
            w, 0u8, b"BILL",
            b"Billie Eilish Reward",
            b"Redeemed by using a Billie ticket",
            option::none(), ctx
        );
        transfer::public_transfer(tcap, sender(ctx));
        transfer::public_share_object(meta);
    }

    public entry fun mint_and_transfer_bill(
        tcap: &mut coin::TreasuryCap<BILL>,
        amount: u64,
        to: address,
        ctx: &mut TxContext
    ) {
        let c = coin::mint<BILL>(tcap, amount, ctx);
        transfer::public_transfer(c, to);
    }
}