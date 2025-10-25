module gift_cards::market {
    use sui::object;
    use sui::transfer;
    use sui::tx_context::{TxContext, sender};
    use sui::sui::SUI;
    use sui::coin;

    use gift_cards::ticket;

    /// Shared listing object that holds the ticket until someone buys.
    /// Needs `store` because we share it.
    struct Listing has key, store {
        id: object::UID,
        seller: address,
        price: u64,
        ticket: ticket::Ticket,
    }

    /// Seller lists a ticket at a fixed SUI price. Listing is shared.
    public entry fun create_listing(
        t: ticket::Ticket,
        price: u64,
        ctx: &mut TxContext
    ) {
        let l = Listing {
            id: object::new(ctx),
            seller: sender(ctx),
            price,
            ticket: t,
        };
        transfer::public_share_object(l);
    }

    /// Seller cancels: take Listing back, send ticket to original seller.
    public entry fun cancel_listing(l: Listing, ctx: &mut TxContext) {
        let Listing { id, seller, price: _, ticket } = l;
        transfer::public_transfer(ticket, seller);
        object::delete(id);
    }

    /// Buyer purchases with SUI coin. Excess SUI is returned as change.
    public entry fun buy(
        l: Listing,
        payment: coin::Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let buyer = sender(ctx);

        // Move out fields so we can delete the UID after.
        let Listing { id, seller, price, ticket } = l;

        // Make the parameter a mutable local so we can split it.
        let mut payment = payment;

        // Ensure sufficient funds
        assert!(coin::value(&payment) >= price, 1);

        // Split exact sale amount to pay seller, leave remainder as change
        let pay_seller = coin::split(&mut payment, price, ctx);

        // Payout & transfers
        transfer::public_transfer(pay_seller, seller);  // seller gets price
        transfer::public_transfer(payment, buyer);      // buyer gets change (if any)
        transfer::public_transfer(ticket, buyer);       // buyer receives ticket

        // Consume the listing object
        object::delete(id);
    }
}