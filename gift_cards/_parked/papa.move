module gift_cards::papa {
    use sui::coin;
    use sui::coin_registry;
    use sui::tx_context::{TxContext, sender};
    use sui::transfer;

    public struct PAPA has drop {}

    fun init(w: PAPA, ctx: &mut TxContext) {
        let (builder, tcap) = coin_registry::new_currency_with_otw(
            w, 2,
            b"PAPA".to_string(),
            b"Papa Johns Gift Card".to_string(),
            b"Stored value for Papa Johns".to_string(),
            b"https://example.com/papa.png".to_string(),
            ctx
        );
        let mcap = builder.finalize(ctx);
        let s = sender(ctx);
        transfer::public_transfer(tcap, s);
        transfer::public_transfer(mcap, s);
    }

    #[allow(lint(public_entry))]
    public entry fun mint(
        tcap: &mut coin::TreasuryCap<PAPA>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let c = coin::mint<PAPA>(tcap, amount, ctx);
        transfer::public_transfer(c, recipient);
    }
}