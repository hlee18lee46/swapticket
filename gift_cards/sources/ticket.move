module gift_cards::ticket {
    use sui::object;
    use sui::tx_context::TxContext;
    use sui::transfer;
    use std::string::String;

    // Artist codes (kept private as constants)
    const ARTIST_SABR: u8 = 1;
    const ARTIST_BILL: u8 = 2;
    const ARTIST_BTS:  u8 = 3;
    const ARTIST_MARO: u8 = 4;

    /// Ticket now stores metadata_url as a String
    struct Ticket has key, store {
        id: object::UID,
        artist: u8,
        price: u64,
        metadata_url: String,
    }

    /// Mint a ticket with a metadata URL to a recipient (organizer calls this)
    public entry fun mint_ticket(
        artist: u8,
        price: u64,
        metadata_url: String,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let t = Ticket { 
            id: object::new(ctx), 
            artist, 
            price, 
            metadata_url 
        };
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
        let Ticket { id, artist, price: _, metadata_url: _ } = t;
        object::delete(id);
        artist
    }

    /// Optional helper: allows updating metadata after minting (e.g., fix broken URL)
    public entry fun set_metadata_url_string(t: &mut Ticket, new_url: String) {
        t.metadata_url = new_url;
    }
}