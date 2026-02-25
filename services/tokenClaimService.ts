import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferInstruction,
} from '@solana/spl-token';
import bs58 from 'bs58';
import GameHistory from '../models/GameHistory';
import User from '../models/User';
import dotenv from 'dotenv';
dotenv.config();

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const CURRENCY_TOKEN_MINT = process.env.CURRENCY_TOKEN_MINT || '7MFWQ1jqWVv23UjKibyz2vo2FtaovtJaik4jp6BrWvLX';
const CURRENCY_TOKEN_DECIMALS = process.env.CURRENCY_TOKEN_DECIMALS ? Number(process.env.CURRENCY_TOKEN_DECIMALS) : 6;
const PLATFORM_WALLET_PRIVATE_KEY = process.env.PLATFORM_WALLET_PRIVATE_KEY || '';

if (!PLATFORM_WALLET_PRIVATE_KEY) {
  console.warn('⚠️ PLATFORM_WALLET_PRIVATE_KEY not set in environment variables');
}

/**
 * Claim tokens for a wallet - transfers tokens from platform wallet to user wallet
 * and marks all unclaimed completed missions as claimed.
 */
export async function claimTokensForWallet(wallet: string): Promise<{
  success: boolean;
  txSignature?: string;
  totalClaimed: number;
  error?: string;
}> {
  if (!PLATFORM_WALLET_PRIVATE_KEY) {
    return { success: false, totalClaimed: 0, error: 'Platform wallet not configured' };
  }

  try {
    const user = await User.findOne({ wallet: wallet.trim() }).select('_id').lean();
    if (!user) {
      return { success: false, totalClaimed: 0, error: 'User not found' };
    }

    // Get all unclaimed completed missions
    const unclaimed = await GameHistory.find({
      player: user._id,
      gameStation: 'completed',
      claimedToken: false,
    }).lean();

    if (unclaimed.length === 0) {
      return { success: false, totalClaimed: 0, error: 'No tokens to claim' };
    }

    // Calculate total tokens to claim
    const totalTokens = unclaimed.reduce((sum, game) => sum + (game.tokenReward ?? 0), 0);

    if (totalTokens <= 0) {
      return { success: false, totalClaimed: 0, error: 'No tokens to claim' };
    }

    // Initialize Solana connection
    const connection = new Connection(RPC_URL, 'confirmed');

    // Load platform wallet from private key
    const platformKeypair = Keypair.fromSecretKey(bs58.decode(PLATFORM_WALLET_PRIVATE_KEY));
    const platformPubkey = platformKeypair.publicKey;

    // User wallet public key
    const userPubkey = new PublicKey(wallet.trim());
    const mintPubkey = new PublicKey(CURRENCY_TOKEN_MINT);

    // Get token accounts
    const platformAta = getAssociatedTokenAddressSync(mintPubkey, platformPubkey);
    const userAta = getAssociatedTokenAddressSync(mintPubkey, userPubkey);

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed');

    // Create transaction
    const tx = new Transaction().add(
      // Ensure user ATA exists
      createAssociatedTokenAccountIdempotentInstruction(platformPubkey, userAta, userPubkey, mintPubkey),
      // Transfer tokens
      createTransferInstruction(platformAta, userAta, platformPubkey, BigInt(Math.floor(totalTokens * 10 ** CURRENCY_TOKEN_DECIMALS)))
    );

    tx.recentBlockhash = blockhash;
    tx.feePayer = platformPubkey;
    tx.sign(platformKeypair);

    // Send transaction
    const signature = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });

    // Confirm transaction
    await connection.confirmTransaction(signature, 'confirmed');

    // Update all unclaimed missions as claimed
    await GameHistory.updateMany(
      {
        player: user._id,
        gameStation: 'completed',
        claimedToken: false,
      },
      {
        $set: { claimedToken: true },
      }
    );

    return {
      success: true,
      txSignature: signature,
      totalClaimed: totalTokens,
    };
  } catch (err) {
    console.error('Error claiming tokens:', err);
    return {
      success: false,
      totalClaimed: 0,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
