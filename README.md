PKG=0xc4f4f9b09ef9f4eead7f78d7482226331c22a870b1050a65ec31760830c31059
TCAP=0x320c933fe5d64e4ae0db19263acf231a144b858fc25c58b2145f193b02b68056
ME=$(sui client active-address)

# Mint 100_000 raw units to yourself (adjust amount as you wish)
sui client call \
  --package $PKG \
  --module burg \
  --function mint_and_transfer_burg \
  --args $TCAP 100000 $ME \
  --gas-budget 10000000




	•	Package ID: 0x21817a438b23e2e0ef70e6dee98491f0ed7ffbdf2ac047fe19c11508ae9e54e8
	•	You own these TreasuryCap objects (we’ll wire four of them into the rewards module):
	•	SABR: 0x997f0eb56e7d1493a164c6205c952be411dc5f5801636749b04d64cd78d2e663
	•	BILL: 0xeb285fb860345c8ddf1e77b01b093533103f273ae777f7e2d716ad483cbd8b3b
	•	BTS:  0x52be2d93ce62cabc3adb8756b8e6ba65db61fb4a2cf065d7175230cf31c1a07c
	•	MARO: 0x0ac306123f334f476ff304a010b424ebb9e80382a1338ad2ebf1d85dbac5d1a4



    sui client call \
  --package 0x21817a438b23e2e0ef70e6dee98491f0ed7ffbdf2ac047fe19c11508ae9e54e8 \
  --module rewards \
  --function create_reward_caps \
  --args 0x997f0eb56e7d1493a164c6205c952be411dc5f5801636749b04d64cd78d2e663 0xeb285fb860345c8ddf1e77b01b093533103f273ae777f7e2d716ad483cbd8b3b 0x52be2d93ce62cabc3adb8756b8e6ba65db61fb4a2cf065d7175230cf31c1a07c 0x0ac306123f334f476ff304a010b424ebb9e80382a1338ad2ebf1d85dbac5d1a4 \
  --gas-budget 10000000 \
  --json \
| jq -r '.objectChanges[]
  | select(.type=="created" and (.objectType|test("::rewards::RewardCaps$")))
  | .objectId'



  PKG=0x32ce0a9f5153513ced41d0eb9f7e36aa0f9c4bc0806f1775f8e30bc3f31cc51f
SABR_CAP=0x555d52163cbb29ee64607a89013be18b8061691be6f329955a83fca9b1ff6d22
BILL_CAP=0x1f85201f3d9fdb0b3c6672361c936af51f3541409a65c1f7c3d4ff2f91a3a234
BTS_CAP=0x2011c798f28e27fac0797de3444d15df251b6e85f2df3ccb6478b1936f4a8085
MARO_CAP=0x73e64d8d4ddfc1c8588b19d71ab366e58a6a177bd46f8a178539872c2e8295b9

sui client call \
  --package $PKG \
  --module rewards \
  --function create_reward_caps \
  --args $SABR_CAP $BILL_CAP $BTS_CAP $MARO_CAP \
  --gas-budget 10000000 \
  --json | jq -r '.objectChanges[]
    | select(.type=="created" and (.objectType|endswith("::rewards::RewardCaps")))
    | .objectId'



0x735bcb5b96ff32d4a80dff1fc1a51adb8ce435f5532e7dbea7c8bfb0851847da



RC_ID=0x735bcb5b96ff32d4a80dff1fc1a51adb8ce435f5532e7dbea7c8bfb0851847da
SELLER=0x76e158c0063bf0ecfd503b3612c65afcacc9d6dff01bf2f404a58b2e6bf016b7

sui client call --package $PKG --module rewards --function admin_mint_to \
  --args $RC_ID 1 1000 $SELLER --gas-budget 10000000

sui client call --package $PKG --module rewards --function admin_mint_to \
  --args $RC_ID 2 1000 $SELLER --gas-budget 10000000

sui client call --package $PKG --module rewards --function admin_mint_to \
  --args $RC_ID 3 1000 $SELLER --gas-budget 10000000

sui client call --package $PKG --module rewards --function admin_mint_to \
  --args $RC_ID 4 1000 $SELLER --gas-budget 10000000