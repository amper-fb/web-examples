/**
 * @desc Refference list of eip155 chains
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
  'near:mainnet': {
    chainId: 'mainnet',
    name: 'NEAR',
    logo: '/chain-logos/near.png',
    rgb: '99, 125, 234',
    rpc: 'https://rpc.mainnet.near.org'
  },
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
  NEAR_SIGN_AND_SEND_TRANSACTION: 'near_signAndSendTransaction',
}
