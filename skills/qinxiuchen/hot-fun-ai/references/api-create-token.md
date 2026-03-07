# Hot.fun Create Token API Reference

## Flow

The `hotfun create-token` command handles the full flow in a single invocation:

1. **Call API** — POST to the hot.fun API with token parameters; receive a base58-encoded Solana transaction.
2. **Sign** — Deserialize the transaction and sign it with the wallet private key.
3. **Send** — Send the signed transaction to Solana RPC and confirm.

## API Endpoint

| Method | Endpoint |
|--------|----------|
| POST | `https://gate.game.com/v3/hotfun/create_pool_with_config` |

### Request

**Content-Type**: `application/x-www-form-urlencoded`

| Parameter | Required | Description |
|-----------|----------|-------------|
| `payer` | Yes | Solana wallet public key (derived from PRIVATE_KEY) |
| `royalty_party` | Yes | Royalty recipient address. Default: `11111111111111111111111111111111` (system program = no royalty) |
| `name` | Yes | Token name |
| `symbol` | Yes | Token symbol |
| `uri` | Yes | Token metadata / image URI (e.g. IPFS link) |

**Required headers**:
```
Origin: https://hot.fun
Referer: https://hot.fun/
```

### Response

```json
{
  "data": {
    "transaction": "<base58-encoded Solana transaction>",
    "signature": "",
    "dbc_config": "<pubkey>",
    "dbc_pool": "<pubkey>",
    "base_mint": "<pubkey>"
  },
  "common": {
    "timestamp": 1772694804,
    "app_name": "hotfunv3",
    "chain_asset_config": [...],
    "config": { "check_chinese_symbol_duplicate": false }
  }
}
```

**Key fields in `data`**:

| Field | Description |
|-------|-------------|
| `transaction` | Base58-encoded Solana transaction to sign and send |
| `base_mint` | The new token's mint address |
| `dbc_config` | DBC config account |
| `dbc_pool` | DBC pool account |

### Example

```bash
curl 'https://gate.game.com/v3/hotfun/create_pool_with_config' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'Origin: https://hot.fun' \
  -H 'Referer: https://hot.fun/' \
  --data-raw 'payer=<WALLET_PUBKEY>&royalty_party=11111111111111111111111111111111&name=MyToken&symbol=MTK&uri=https%3A%2F%2Fexample.com%2Fmetadata.json'
```

## Sign and Send

1. Decode the base58 `transaction` string to bytes.
2. Deserialize as a `VersionedTransaction`.
3. Sign with the wallet `Keypair`.
4. Send via `connection.sendRawTransaction()`.
5. Confirm via `connection.confirmTransaction()`.
