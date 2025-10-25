module gift_cards::domn {
    use sui::coin;
    use sui::coin_registry;
    use sui::tx_context::{TxContext, sender};
    use sui::transfer;

    public struct DOMN has drop {}

    fun init(w: DOMN, ctx: &mut TxContext) {
        let (builder, tcap) = coin_registry::new_currency_with_otw(
            w, 2,
            b"DOMN".to_string(),
            b"Dominos Gift Card".to_string(),
            b"Stored value for Dominos".to_string(),
            b"https://example.com/domn.png".to_string(),
            ctx
        );
        let mcap = builder.finalize(ctx);
        let s = sender(ctx);
        transfer::public_transfer(tcap, s);
        transfer::public_transfer(mcap, s);
    }

    #[allow(lint(public_entry))]
    public entry fun mint(
        tcap: &mut coin::TreasuryCap<DOMN>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let c = coin::mint<DOMN>(tcap, amount, ctx);
        transfer::public_transfer(c, recipient);
    }
}