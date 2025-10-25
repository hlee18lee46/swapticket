module gift_cards::subw {
    use sui::coin;
    use sui::coin_registry;
    use sui::tx_context::{TxContext, sender};
    use sui::transfer;

    public struct SUBW has drop {}

    fun init(w: SUBW, ctx: &mut TxContext) {
        let (builder, tcap) = coin_registry::new_currency_with_otw(
            w, 2,
            b"SUBW".to_string(),
            b"Subway Gift Card".to_string(),
            b"Stored value for Subway".to_string(),
            b"https://example.com/subw.png".to_string(),
            ctx
        );
        let mcap = builder.finalize(ctx);
        let s = sender(ctx);
        transfer::public_transfer(tcap, s);
        transfer::public_transfer(mcap, s);
    }

    #[allow(lint(public_entry))]
    public entry fun mint(
        tcap: &mut coin::TreasuryCap<SUBW>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let c = coin::mint<SUBW>(tcap, amount, ctx);
        transfer::public_transfer(c, recipient);
    }
}