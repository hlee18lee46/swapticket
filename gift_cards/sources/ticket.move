module gift_cards::ticket {
    use sui::object;
    use sui::tx_context::TxContext;

    // Artist codes (kept private as constants)
    const ARTIST_SABR: u8 = 1;
    const ARTIST_BILL: u8 = 2;
    const ARTIST_BTS:  u8 = 3;
    const ARTIST_MARO: u8 = 4;

    // legacy edition: DO NOT write `public struct`
    struct Ticket has key, store {
        id: object::UID,
        artist: u8,
        price: u64,
    }

    /// Mint a ticket to a recipient (organizer calls this)
    public entry fun mint_ticket(
        artist: u8,
        price: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        use sui::transfer;
        let t = Ticket { id: object::new(ctx), artist, price };
        transfer::public_transfer(t, recipient)
    }

    /// SAFE API exposed to other modules:

    /// Return code constants via functions (public constants aren’t allowed in legacy).
    public fun code_sabr(): u8 { ARTIST_SABR }
    public fun code_bill(): u8 { ARTIST_BILL }
    public fun code_bts():  u8 { ARTIST_BTS }
    public fun code_maro(): u8 { ARTIST_MARO }

    /// Burn a ticket and return its artist code (so other modules don’t destruct it).
    public fun burn_and_get_artist(t: Ticket): u8 {
        let Ticket { id, artist, price: _ } = t;
        object::delete(id);
        artist
    }
}