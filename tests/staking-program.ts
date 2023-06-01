import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { StakingProgram } from "../target/types/staking_program";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { wallet } from "./wallet";

describe("staking-program", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.StakingProgram as Program<StakingProgram>;

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;
  // const mintKeypair = Keypair.generate();
  const connection = new Connection("http://127.0.0.1:8899", "confirmed");
  let mintKeypair = Keypair.fromSecretKey(new Uint8Array(wallet));

  async function createMintToken() {
    await createMint(
      connection,
      payer.payer,
      payer.publicKey,
      payer.publicKey,
      8,
      mintKeypair
    );
  }

  console.log(mintKeypair);

  it("Is initialized!", async () => {
    // Add your test here.

    await createMintToken();

    let [stakePool] = PublicKey.findProgramAddressSync(
      [Buffer.from("stake_pool")],
      program.programId
    );

    const tx = await program.methods
      .initialize()
      .accounts({
        signer: payer.publicKey,
        stakePoolAccount: stakePool,
        mint: mintKeypair.publicKey,
      })
      .rpc();
    console.log("Your transaction signature", tx);
  });

  it("Stake!", async () => {
    let userTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer.payer,
      mintKeypair.publicKey,
      payer.publicKey
    );

    await mintTo(
      connection,
      payer.payer,
      mintKeypair.publicKey,
      userTokenAccount.address,
      payer.payer,
      1e10
    );

    let [stakeInfo] = PublicKey.findProgramAddressSync(
      [Buffer.from("stake_info"), payer.publicKey.toBuffer()],
      program.programId
    );

    let [playerStakeTokenAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("token"), payer.publicKey.toBuffer()],
      program.programId
    );

    await getOrCreateAssociatedTokenAccount(
      connection,
      payer.payer,
      mintKeypair.publicKey,
      payer.publicKey
    );

    const tx = await program.methods
      .stake(new anchor.BN(1))
      .signers([payer.payer])
      .accounts({
        stakeInfo: stakeInfo,
        signer: payer.publicKey,
        mint: mintKeypair.publicKey,
        playerStakeTokenAccount: playerStakeTokenAccount,
        playerTokenAccount: userTokenAccount.address,
      })
      .rpc();
    console.log("Your transaction signature", tx);
  });

  it("unstake", async () => {
    let userTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer.payer,
      mintKeypair.publicKey,
      payer.publicKey
    );

    let [stakeInfo] = PublicKey.findProgramAddressSync(
      [Buffer.from("stake_info"), payer.publicKey.toBuffer()],
      program.programId
    );

    let [playerStakeTokenAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("token"), payer.publicKey.toBuffer()],
      program.programId
    );

    await getOrCreateAssociatedTokenAccount(
      connection,
      payer.payer,
      mintKeypair.publicKey,
      payer.publicKey
    );

    let [stakePool] = PublicKey.findProgramAddressSync(
      [Buffer.from("stake_pool")],
      program.programId
    );

    await mintTo(
      connection,
      payer.payer,
      mintKeypair.publicKey,
      stakePool,
      payer.payer,
      1e11
    );

    const tx = await program.methods
      .unstake()
      .signers([payer.payer])
      .accounts({
        stakeInfo: stakeInfo,
        signer: payer.publicKey,
        mint: mintKeypair.publicKey,
        stakePoolAccount: stakePool,
        playerStakeTokenAccount: playerStakeTokenAccount,
        playerTokenAccount: userTokenAccount.address,
      })
      .rpc();
    console.log("Your transaction signature", tx);
  });
});
