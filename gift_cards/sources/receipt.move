module gift_cards::receipt {
    use sui::object;
    use sui::transfer;
    use sui::tx_context::{TxContext, sender};
    use sui::event;
    use std::string::{String, utf8};

    /// Simple receipt NFT
    struct Receipt has key, store {
        id: object::UID,
        buyer: address,
        seller: address,
        artist: String,
        title: String,
        coin: String,          // coin ticker or type string
        amount: u64,           // base units paid
        created_at_ms: u64,
    }

    /// Optional event for easy indexing
    struct ReceiptMinted has copy, drop {
        buyer: address,
        seller: address,
        artist: String,
        title: String,
        coin: String,
        amount: u64,
    }

    /// Can be called from a PTB (payment + receipt mint in one txn).
    /// Note: `public` is enough to call from PTBs; you don't need `entry`.
    public fun mint_receipt(
        to: address,           // who receives the receipt object (buyer)
        seller: address,
        artist: String,
        title: String,
        coin: String,
        amount: u64,
        now_ms: u64,
        ctx: &mut TxContext
    ) {
        let r = Receipt {
            id: object::new(ctx),
            buyer: sender(ctx),
            seller,
            artist,
            title,
            coin,
            amount,
            created_at_ms: now_ms,
        };
        event::emit(ReceiptMinted { buyer: sender(ctx), seller, artist: r.artist, title: r.title, coin: r.coin, amount });
        transfer::public_transfer(r, to);
    }
}