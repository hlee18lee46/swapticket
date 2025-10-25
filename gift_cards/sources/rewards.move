module gift_cards::rewards {
    use sui::object;
    use sui::tx_context::{TxContext, sender};
    use sui::transfer;
    use sui::coin;

    use gift_cards::ticket;
    use gift_cards::sabr;
    use gift_cards::bill;
    use gift_cards::bts;
    use gift_cards::maro;

    // legacy edition: DO NOT write `public struct`
    struct RewardCaps has key, store {
        id: object::UID,
        sabr: coin::TreasuryCap<sabr::SABR>,
        bill: coin::TreasuryCap<bill::BILL>,
        bts:  coin::TreasuryCap<bts::BTS>,
        maro: coin::TreasuryCap<maro::MARO>,
    }

    /// Initialize RewardCaps by depositing all four caps. Call once.
    public entry fun create_reward_caps(
        sabr_cap: coin::TreasuryCap<sabr::SABR>,
        bill_cap: coin::TreasuryCap<bill::BILL>,
        bts_cap:  coin::TreasuryCap<bts::BTS>,
        maro_cap: coin::TreasuryCap<maro::MARO>,
        ctx: &mut TxContext
    ) {
        let rc = RewardCaps {
            id: object::new(ctx),
            sabr: sabr_cap,
            bill: bill_cap,
            bts:  bts_cap,
            maro: maro_cap
        };
        transfer::public_share_object(rc);
    }

    /// Redeem a ticket (burn it) and mint 1 unit of the right artist coin to caller.
    public entry fun redeem_and_reward(
        rc: &mut RewardCaps,
        t: ticket::Ticket,
        ctx: &mut TxContext
    ) {
        let artist = ticket::burn_and_get_artist(t);

        if (artist == ticket::code_sabr()) {
            let c = coin::mint<sabr::SABR>(&mut rc.sabr, 1, ctx);
            transfer::public_transfer(c, sender(ctx));
            return
        };
        if (artist == ticket::code_bill()) {
            let c = coin::mint<bill::BILL>(&mut rc.bill, 1, ctx);
            transfer::public_transfer(c, sender(ctx));
            return
        };
        if (artist == ticket::code_bts()) {
            let c = coin::mint<bts::BTS>(&mut rc.bts, 1, ctx);
            transfer::public_transfer(c, sender(ctx));
            return
        };
        if (artist == ticket::code_maro()) {
            let c = coin::mint<maro::MARO>(&mut rc.maro, 1, ctx);
            transfer::public_transfer(c, sender(ctx));
            return
        };
        // Unknown artist code: no-op or add an assert! if you prefer.
    }

    /// Artist codes re-used (same as ticket’s helpers), so you can select which coin to mint.
    public entry fun admin_mint_to(
        rc: &mut RewardCaps,
        artist_code: u8,          // 1=SABR, 2=BILL, 3=BTS, 4=MARO (match your ticket::code_*())
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        if (artist_code == ticket::code_sabr()) {
            let c = coin::mint<sabr::SABR>(&mut rc.sabr, amount, ctx);
            transfer::public_transfer(c, recipient);
            return
        };
        if (artist_code == ticket::code_bill()) {
            let c = coin::mint<bill::BILL>(&mut rc.bill, amount, ctx);
            transfer::public_transfer(c, recipient);
            return
        };
        if (artist_code == ticket::code_bts()) {
            let c = coin::mint<bts::BTS>(&mut rc.bts, amount, ctx);
            transfer::public_transfer(c, recipient);
            return
        };
        if (artist_code == ticket::code_maro()) {
            let c = coin::mint<maro::MARO>(&mut rc.maro, amount, ctx);
            transfer::public_transfer(c, recipient);
            return
        };
    }
}