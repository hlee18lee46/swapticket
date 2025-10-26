module gift_cards::bridge {
    use std::string::String;
    use sui::event;
    use sui::object;
    use sui::table::{Self as table, Table};
    use sui::transfer;
    use sui::tx_context::{TxContext, sender};

    /// one-time witness to enable package initializer
    struct BRIDGE has drop {}

    /// Shared vault that holds locked NFTs.
    struct Vault has key {
        id: object::UID,
    }

    /// Authority that’s allowed to unlock NFTs (MVP centralized).
    struct RelayerCap has key, store {
        id: object::UID,
        relayer: address,
    }

    /// Global shared state for nonce + replay/lock bookkeeping.
    struct State has key {
        id: object::UID,
        nonce: u64,
        locked: Table<address, bool>,         // object id -> locked?
        processed: Table<vector<u8>, bool>,   // arbitrary replay keys if needed
    }

    const E_NOT_RELAYER: u64 = 1;
    const E_NOT_LOCKED: u64  = 2;

    /// Package initializer (called automatically at publish).
    /// Relayer defaults to the publisher address (sender(ctx)).
    fun init(_: BRIDGE, ctx: &mut TxContext) {
        // share the vault
        let vault = Vault { id: object::new(ctx) };
        transfer::share_object(vault);

        // mint relayer cap to publisher
        let cap = RelayerCap { id: object::new(ctx), relayer: sender(ctx) };
        transfer::public_transfer(cap, sender(ctx));

        // shared state
        let s = State {
            id: object::new(ctx),
            nonce: 0,
            locked: table::new(ctx),
            processed: table::new(ctx),
        };
        transfer::share_object(s);
    }

    /// Event the relayer watches on Sui.
    struct LockedEvent has copy, drop, store {
        object_id: address,        // locked NFT object id
        dest_chain: u16,           // informational
        dest_addr: vector<u8>,     // 20 bytes EVM address
        nonce: u64,
        token_uri: String,         // optional, can be ""
    }

    /// Lock an NFT into the Vault and emit an event the relayer consumes.
    public fun lock_nft<T: key + store>(
        v: &mut Vault,
        s: &mut State,
        nft: T,
        dest_chain: u16,
        dest_addr: vector<u8>,
        token_uri: String,
        ctx: &mut TxContext
    ) {
        let oid_addr = object::id_address(&nft);

        // mark locked and move NFT under the vault’s address
        table::add(&mut s.locked, oid_addr, true);
        transfer::public_transfer(nft, object::uid_to_address(&v.id));

        let n = s.nonce;
        s.nonce = n + 1;

        event::emit(LockedEvent {
            object_id: oid_addr,
            dest_chain,
            dest_addr,
            nonce: n,
            token_uri,
        });
    }

    /// Unlock an NFT from the Vault to `to` (relayer-gated).
    public fun unlock_nft<T: key + store>(
        _v: &mut Vault,
        s: &mut State,
        cap: &RelayerCap,
        nft: T,
        to: address,
        ctx: &TxContext
    ) {
        assert!(sender(ctx) == cap.relayer, E_NOT_RELAYER);

        let oid_addr = object::id_address(&nft);
        let is_locked = *table::borrow(&s.locked, oid_addr);
        assert!(is_locked, E_NOT_LOCKED);

        // mark unlocked
        *table::borrow_mut(&mut s.locked, oid_addr) = false;

        transfer::public_transfer(nft, to);
    }
}