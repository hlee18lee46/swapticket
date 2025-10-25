module gift_cards::market {
    use sui::object;
    use sui::transfer;
    use sui::tx_context::{TxContext, sender};
    use sui::sui::SUI;
    use sui::coin;
    use std::option::{Self as option, Option};

    use gift_cards::ticket;

    /// Shared listing so anyone can call `buy`.
    struct Listing has key, store {
        id: object::UID,
        seller: address,
        price: u64,
        ticket: Option<ticket::Ticket>,
        active: bool,
    }

    /// Seller lists a ticket for a fixed SUI price.
    public entry fun create_listing(
        t: ticket::Ticket,
        price: u64,
        ctx: &mut TxContext
    ) {
        let l = Listing {
            id: object::new(ctx),
            seller: sender(ctx),
            price,
            ticket: option::some<ticket::Ticket>(t),
            active: true,
        };
        transfer::public_share_object(l);
    }

    /// Seller cancels: takes back ticket and deactivates the listing.
    public entry fun cancel_listing(l: &mut Listing, ctx: &mut TxContext) {
        assert!(sender(ctx) == l.seller, 1);
        assert!(l.active, 2);

        let t = option::extract(&mut l.ticket);
        transfer::public_transfer(t, l.seller);
        l.active = false;
        l.price = 0;
    }

    /// Buyer purchases with SUI. Excess SUI is returned to buyer as change.
    public entry fun buy(
        l: &mut Listing,
        payment: coin::Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let buyer = sender(ctx);

        assert!(l.active, 3);
        assert!(option::is_some(&l.ticket), 4);

        // Move the parameter into a local, then borrow it mutably when needed.
        let pay = payment;
        assert!(coin::value(&pay) >= l.price, 5);

        // Split out seller’s payment; `pay` keeps the change.
        let pay_seller = coin::split(&mut pay, l.price, ctx);

        // Payout seller and return change.
        transfer::public_transfer(pay_seller, l.seller);
        transfer::public_transfer(pay, buyer);

        // Deliver the ticket and deactivate listing.
        let t = option::extract(&mut l.ticket);
        transfer::public_transfer(t, buyer);
        l.active = false;
        l.price = 0;
    }
}