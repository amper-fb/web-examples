/**
 * @desc Reference list of NEAR chains
 * @url https://chainlist.org
 */

/**
 * Types
 */
export type TNearChain = keyof typeof NEAR_CHAINS

/**
 * Chains
 */
export const NEAR_MAINNET_CHAINS = {
  // TODO: Dev account creation isn't supported on NEAR Mainnet.
}

export const NEAR_TEST_CHAINS = {
  'near:testnet': {
    chainId: 'testnet',
    name: 'NEAR Testnet',
    logo: '/chain-logos/near.png',
    rgb: '99, 125, 234',
    rpc: 'https://rpc.testnet.near.org'
  },
}

export const NEAR_CHAINS = { ...NEAR_MAINNET_CHAINS, ...NEAR_TEST_CHAINS }

/**
 * Methods
 */
export const NEAR_SIGNING_METHODS = {
  NEAR_SIGN_TRANSACTION: 'near_signTransaction',
  NEAR_SIGN_TRANSACTIONS: 'near_signTransactions',
  NEAR_SIGN_IN: 'near_signIn',
  NEAR_SIGN_OUT: 'near_signOut',
  NEAR_SIGN_AND_SEND_TRANSACTION: 'near_signAndSendTransaction',
  NEAR_SIGN_AND_SEND_TRANSACTIONS: 'near_signAndSendTransactions',
}