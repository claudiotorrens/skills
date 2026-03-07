#!/usr/bin/env node
/**
 * Hot.fun - create token: full flow (API → sign → send).
 *
 * 1. Call hot.fun API to get a base58-encoded Solana transaction
 * 2. Sign the transaction with the wallet private key
 * 3. Send the signed transaction to Solana RPC
 *
 * Usage:
 *   npx hotfun create-token <name> <symbol> <uri>
 *
 * Env: PRIVATE_KEY (Solana wallet private key, base58 or JSON array)
 * Optional env: SOLANA_RPC_URL, ROYALTY_PARTY
 */

import {
  Connection,
  Keypair,
  VersionedTransaction,
} from '@solana/web3.js';
import bs58 from 'bs58';

const API_URL = 'https://gate.game.com/v3/hotfun/create_pool_with_config';
const DEFAULT_ROYALTY_PARTY = '11111111111111111111111111111111';

function loadKeypair(privateKey: string): Keypair {
  try {
    if (privateKey.startsWith('[')) {
      const arr = JSON.parse(privateKey);
      return Keypair.fromSecretKey(new Uint8Array(arr));
    }
    return Keypair.fromSecretKey(bs58.decode(privateKey));
  } catch {
    throw new Error('Invalid PRIVATE_KEY format. Use base58 string or JSON array of bytes.');
  }
}

async function main() {
  const name = process.argv[2];
  const symbol = process.argv[3];
  const uri = process.argv[4];

  if (!name || !symbol || !uri) {
    console.error('Usage: npx hotfun create-token <name> <symbol> <uri>');
    console.error('Example: npx hotfun create-token MyToken MTK "https://example.com/metadata.json"');
    process.exit(1);
  }

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('Set PRIVATE_KEY (Solana wallet private key, base58 or JSON array)');
    process.exit(1);
  }

  const keypair = loadKeypair(privateKey);
  const payer = keypair.publicKey.toBase58();
  const royaltyParty = process.env.ROYALTY_PARTY || DEFAULT_ROYALTY_PARTY;
  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  const connection = new Connection(rpcUrl, 'confirmed');

  // ── Step 1: Call API to get transaction ────────────────────────────────
  console.error(`Creating token "${name}" (${symbol}) ...`);
  console.error(`  payer: ${payer}`);
  console.error(`  uri: ${uri}`);

  const body = new URLSearchParams({
    payer,
    royalty_party: royaltyParty,
    name,
    symbol,
    uri,
  });

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Origin': 'https://hot.fun',
      'Referer': 'https://hot.fun/',
    },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json() as {
    data: {
      transaction: string;
      signature: string;
      dbc_config: string;
      dbc_pool: string;
      base_mint: string;
    };
    common: Record<string, unknown>;
  };

  const { transaction: txBase58, dbc_config, dbc_pool, base_mint } = json.data;

  if (!txBase58) {
    throw new Error('API returned empty transaction. Response: ' + JSON.stringify(json));
  }

  console.error(`  base_mint: ${base_mint}`);
  console.error(`  dbc_config: ${dbc_config}`);
  console.error(`  dbc_pool: ${dbc_pool}`);

  // ── Step 2: Deserialize and sign transaction ──────────────────────────
  const txBytes = bs58.decode(txBase58);
  const tx = VersionedTransaction.deserialize(txBytes);
  tx.sign([keypair]);

  // ── Step 3: Send to Solana RPC ────────────────────────────────────────
  console.error('Sending transaction ...');
  const txHash = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  });

  console.error('Confirming ...');
  const confirmation = await connection.confirmTransaction(txHash, 'confirmed');

  if (confirmation.value.err) {
    throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
  }

  // ── Output ────────────────────────────────────────────────────────────
  const out = {
    txHash,
    wallet: payer,
    baseMint: base_mint,
    dbcConfig: dbc_config,
    dbcPool: dbc_pool,
    name,
    symbol,
    uri,
  };
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
