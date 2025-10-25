module gift_cards::gift_cards {
    use std::string;
    use sui::coin;
    use sui::tx_context::{Self, TxContext};
    use sui::object;
    use sui::transfer;
    use sui::bag;

    /// === Coin Type Declarations (one per brand) ===
    /// Abilities required for Sui coins are usually `drop, store`.
    struct BURG has drop, store {}
    struct SUBW has drop, store {}
    struct JIMM has drop, store {}
    struct QUIZ has drop, store {}
    struct DOMN has drop, store {}
    struct PAPA has drop, store {}

    /// Holds all TreasuryCaps in one admin-controlled object.
    struct AdminCap has key {
        id: object::UID,
        burg: coin::TreasuryCap<BURG>,
        subw: coin::TreasuryCap<SUBW>,
        jimm: coin::TreasuryCap<JIMM>,
        quiz: coin::TreasuryCap<QUIZ>,
        domn: coin::TreasuryCap<DOMN>,
        papa: coin::TreasuryCap<PAPA>,
    }

    /// ========================
    /// ========== INIT ========
    /// ========================
    public entry fun init(ctx: &mut TxContext) {
        // You can change decimals to 2 if you want pure “dollar.cents” style.
        let decimals = 2u8;

        // (symbol, name, description, icon_url) for each brand
        let (burg_tc, _) = create_currency<BURG>(
            decimals,
            "BURG", "Burger Gift Card", "Gift-card balance for Burger brand", "",
            ctx
        );
        let (subw_tc, _) = create_currency<SUBW>(
            decimals,
            "SUBW", "Subway Gift Card", "Gift-card balance for Subway brand", "",
            ctx
        );
        let (jimm_tc, _) = create_currency<JIMM>(
            decimals,
            "JIMM", "Jimmy John's Gift Card", "Gift-card balance for Jimmy John's", "",
            ctx
        );
        let (quiz_tc, _) = create_currency<QUIZ>(
            decimals,
            "QUIZ", "Quiznos Gift Card", "Gift-card balance for Quiznos", "",
            ctx
        );
        let (domn_tc, _) = create_currency<DOMN>(
            decimals,
            "DOMN", "Domino's Gift Card", "Gift-card balance for Domino's", "",
            ctx
        );
        let (papa_tc, _) = create_currency<PAPA>(
            decimals,
            "PAPA", "Papa John's Gift Card", "Gift-card balance for Papa John's", "",
            ctx
        );

        // Mint a zero-amount dummy to ensure registration for sender accounts later is easy (optional)

        // Create a single AdminCap that owns all six treasury caps
        let cap = AdminCap {
            id: object::new(ctx),
            burg: burg_tc,
            subw: subw_tc,
            jimm: jimm_tc,
            quiz: quiz_tc,
            domn: domn_tc,
            papa: papa_tc,
        };

        // Send AdminCap to the publisher (tx sender)
        transfer::public_transfer(cap, tx_context::sender(ctx));
    }

    /// Helper that wraps coin::create_currency with metadata.
    fun create_currency<CoinType: drop + store>(
        decimals: u8,
        symbol: &string::String,
        name: &string::String,
        description: &string::String,
        icon_url: &string::String,
        ctx: &mut TxContext,
    ): (coin::TreasuryCap<CoinType>, coin::Supply<CoinType>) {
        // coin::create_currency publishes metadata and returns TreasuryCap & Supply.
        // Supply is kept (or can be stored) if you need to query total supply on-chain.
        coin::create_currency<CoinType>(
            decimals,
            string::utf8(symbol),
            string::utf8(name),
            string::utf8(description),
            string::utf8(icon_url),
            ctx
        )
    }

    /// ==========================
    /// ======= MINTING ==========
    /// ==========================
    /// Each function mints `amount` of the respective coin to `recipient`.
    /// `amount` is in base units (respecting `decimals`, e.g. 2 → cents).
    public entry fun mint_burg(admin: &mut AdminCap, recipient: address, amount: u64, ctx: &mut TxContext) {
        let c = coin::mint<BURG>(amount, &mut admin.burg);
        transfer::public_transfer(c, recipient);
    }

    public entry fun mint_subw(admin: &mut AdminCap, recipient: address, amount: u64, ctx: &mut TxContext) {
        let c = coin::mint<SUBW>(amount, &mut admin.subw);
        transfer::public_transfer(c, recipient);
    }

    public entry fun mint_jimm(admin: &mut AdminCap, recipient: address, amount: u64, ctx: &mut TxContext) {
        let c = coin::mint<JIMM>(amount, &mut admin.jimm);
        transfer::public_transfer(c, recipient);
    }

    public entry fun mint_quiz(admin: &mut AdminCap, recipient: address, amount: u64, ctx: &mut TxContext) {
        let c = coin::mint<QUIZ>(amount, &mut admin.quiz);
        transfer::public_transfer(c, recipient);
    }

    public entry fun mint_domn(admin: &mut AdminCap, recipient: address, amount: u64, ctx: &mut TxContext) {
        let c = coin::mint<DOMN>(amount, &mut admin.domn);
        transfer::public_transfer(c, recipient);
    }

    public entry fun mint_papa(admin: &mut AdminCap, recipient: address, amount: u64, ctx: &mut TxContext) {
        let c = coin::mint<PAPA>(amount, &mut admin.papa);
        transfer::public_transfer(c, recipient);
    }

    /// Optional: expose a way to transfer the AdminCap to a multisig or DAO later.
    public entry fun transfer_admincap(cap: AdminCap, to: address) {
        transfer::public_transfer(cap, to);
    }
}