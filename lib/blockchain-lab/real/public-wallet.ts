import { TCODE_MINT } from '@/lib/tcode/config'
import { isSolanaAddress, TcodeError } from '@/lib/tcode/crypto'
import { formatUnits, lamportsToSol } from './constants'
import { getBalanceLamports, getTokenAccounts } from './rpc'

export const TERA_WALLET_PUBLIC = {
  id: 'wallet',
  name: 'Tera Wallet',
  custody: 'self-custodial',
  chain: 'solana',
  cluster: 'mainnet-beta',
  derivationPath: "m/44'/501'/0'/0'",
  url: 'https://teraai.chat/wallet',
  docs: 'https://teraai.chat/docs/wallet',
  news: 'https://teraai.chat/news/tera-wallet',
  token: {
    symbol: 'TCODE',
    name: 'Talocode',
    mint: TCODE_MINT,
    decimals: 6,
    program: 'spl-token',
  },
  rules: [
    'Keys stay in the browser. Tera never receives a recovery phrase, private key, or passcode.',
    'Solana only. Official $TCODE is the mint above.',
    'A passcode encrypts the local vault. It is not a hardware wallet.',
  ],
}

const SECRET_FIELD = /mnemonic|seed|private[_ ]?key|secret[_ ]?key|passcode|recovery phrase/i

export function assertNoWalletSecrets(body: unknown) {
  const text = JSON.stringify(body ?? '')
  if (SECRET_FIELD.test(text)) {
    throw new TcodeError(400, 'secret_rejected', 'Tera Wallet is self-custodial. Do not send a seed, private key, or passcode.')
  }
}

export async function readPublicWallet(address: string) {
  if (!isSolanaAddress(address)) {
    throw new TcodeError(400, 'invalid_address', 'That is not a Solana address.')
  }
  const [lamports, tokens] = await Promise.all([
    getBalanceLamports(address),
    getTokenAccounts(address),
  ])
  const tcode = tokens.find((token) => token.mint === TCODE_MINT)
  return {
    address,
    cluster: 'mainnet-beta',
    sol: lamportsToSol(lamports),
    tcode: tcode ? formatUnits(tcode.amount, tcode.decimals) : 0,
    tokens: tokens
      .filter((token) => Number(token.amount) > 0)
      .slice(0, 12)
      .map((token) => ({
        mint: token.mint,
        amount: formatUnits(token.amount, token.decimals),
        decimals: token.decimals,
      })),
    wallet: TERA_WALLET_PUBLIC.url,
  }
}
