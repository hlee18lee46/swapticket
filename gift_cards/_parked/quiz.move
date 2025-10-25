module gift_cards::quiz {
    use sui::coin;
    use sui::coin_registry;
    use sui::tx_context::{TxContext, sender};
    use sui::transfer;

    public struct QUIZ has drop {}

    fun init(w: QUIZ, ctx: &mut TxContext) {
        let (builder, tcap) = coin_registry::new_currency_with_otw(
            w, 2,
            b"QUIZ".to_string(),
            b"Quiznos Gift Card".to_string(),
            b"Stored value for Quiznos".to_string(),
            b"https://example.com/quiz.png".to_string(),
            ctx
        );
        let mcap = builder.finalize(ctx);
        let s = sender(ctx);
        transfer::public_transfer(tcap, s);
        transfer::public_transfer(mcap, s);
    }

    #[allow(lint(public_entry))]
    public entry fun mint(
        tcap: &mut coin::TreasuryCap<QUIZ>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let c = coin::mint<QUIZ>(tcap, amount, ctx);
        transfer::public_transfer(c, recipient);
    }
}