module gift_cards::jimm {
    use sui::coin;
    use sui::coin_registry;
    use sui::tx_context::{TxContext, sender};
    use sui::transfer;

    public struct JIMM has drop {}

    fun init(w: JIMM, ctx: &mut TxContext) {
        let (builder, tcap) = coin_registry::new_currency_with_otw(
            w, 2,
            b"JIMM".to_string(),
            b"Jimmy Johns Gift Card".to_string(),
            b"Stored value for Jimmy Johns".to_string(),
            b"https://example.com/jimm.png".to_string(),
            ctx
        );
        let mcap = builder.finalize(ctx);
        let s = sender(ctx);
        transfer::public_transfer(tcap, s);
        transfer::public_transfer(mcap, s);
    }

    #[allow(lint(public_entry))]
    public entry fun mint(
        tcap: &mut coin::TreasuryCap<JIMM>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let c = coin::mint<JIMM>(tcap, amount, ctx);
        transfer::public_transfer(c, recipient);
    }
}