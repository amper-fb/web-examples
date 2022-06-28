import {
  InMemorySigner,
  providers,
  Signer,
  keyStores as nearKeyStores,
  transactions as nearTransactions,
  utils,
} from "near-api-js";
import { AccessKeyView } from "near-api-js/lib/providers/provider";
import BN from "bn.js";

import { signClient } from "@/utils/WalletConnectUtil";
import { NEAR_CHAINS, TNearChain } from "@/data/NEARData";

const MAX_ACCOUNTS = 2;

interface Account {
  accountId: string;
  publicKey: string;
}

interface Transaction {
  signerId: string;
  receiverId: string;
  actions: Array<any>;
}

interface ValidateAccessKeyParams {
  accessKey: AccessKeyView;
  transaction: Transaction;
}

interface GetTransactionPermissionParams {
  chainId: string;
  topic: string;
  transaction: Transaction;
}

interface TransactionPermission {
  accessKey: AccessKeyView;
  signer: Signer;
}

interface SignInParams {
  chainId: string;
  topic: string;
  contractId: string;
  methodNames: Array<string>;
  accounts: Array<Account>;
}

interface SignOutParams {
  chainId: string;
  topic: string;
  accounts: Array<Account>;
}

interface IsElevatedPermissionParams {
  chainId: string;
  topic: string;
  transactions: Array<Transaction>;
}

interface SignTransactionsParams {
  chainId: string;
  topic: string;
  transactions: Array<Transaction>;
}

interface SignAndSendTransactionParams {
  chainId: string;
  topic: string;
  transaction: Transaction;
}

interface SignAndSendTransactionsParams {
  chainId: string;
  topic: string;
  transactions: Array<Transaction>;
}

export class NearWallet {
  private networkId: string;
  private keyStore: nearKeyStores.KeyStore;

  static async init(networkId: string) {
    const keyStore = new nearKeyStores.BrowserLocalStorageKeyStore();
    const accounts = await keyStore.getAccounts(networkId);

    for (let i = 0; i < Math.max(MAX_ACCOUNTS - accounts.length, 0); i += 1) {
      const { accountId, keyPair } = await NearWallet.createDevAccount();

      await keyStore.setKey(networkId, accountId, keyPair);
    }

    return new NearWallet(networkId, keyStore);
  }

  static async createDevAccount() {
    const keyPair = utils.KeyPair.fromRandom("ed25519");
    const randomNumber = Math.floor(Math.random() * (99999999999999 - 10000000000000) + 10000000000000);
    const accountId = `dev-${Date.now()}-${randomNumber}`;
    const publicKey = keyPair.getPublicKey().toString();

    return fetch(`https://helper.testnet.near.org/account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        newAccountId: accountId,
        newAccountPublicKey: publicKey,
      }),
    })
      .then((res) => {
        if (res.ok) {
          return {
            accountId,
            keyPair
          };
        }

        throw new Error("Failed to create NEAR dev account");
      });
  }

  private constructor(networkId: string, keyStore: nearKeyStores.KeyStore) {
    this.networkId = networkId;
    this.keyStore = keyStore;
  }

  // Retrieve all imported accounts from wallet.
  async getAccounts(): Promise<Array<Account>> {
    const accountIds = await this.keyStore.getAccounts(this.networkId);

    return Promise.all(
      accountIds.map(async (accountId) => {
        const keyPair = await this.keyStore.getKey(this.networkId, accountId);

        return {
          accountId,
          publicKey: keyPair.getPublicKey().toString(),
        };
      })
    );
  }

  private isAccountsValid(topic: string, accounts: Array<{ accountId: string; }>) {
    const session = signClient.session.get(topic);
    const validAccountIds = session.namespaces.near.accounts.map((accountId) => {
      return accountId.split(":")[2];
    })

    return accounts.every(({ accountId }) => {
      return validAccountIds.includes(accountId);
    });
  }

  private isTransactionsValid(topic: string, transactions: Array<Transaction>) {
    const accounts = transactions.map(({ signerId }) => ({ accountId: signerId }));

    return this.isAccountsValid(topic, accounts);
  }

  private transformAccessKeyPermission(permission: any) {
    if (permission === "FullAccess") {
      return nearTransactions.fullAccessKey();
    }

    const { receiverId, methodNames = [] } = permission;
    const allowance = permission.allowance
      ? new BN(permission.allowance)
      : undefined;

    return nearTransactions.functionCallAccessKey(receiverId, methodNames, allowance);
  }

  private transformActions(actions: any) {
    return actions.map((action: any) => {
      switch (action.type) {
        case "FunctionCall": {
          const { methodName, args, gas, deposit } = action.params;

          return nearTransactions.functionCall(methodName,
            args,
            new BN(gas),
            new BN(deposit));
        }
        case "AddKey": {
          const { publicKey, accessKey } = action.params;

          return nearTransactions.addKey(
            utils.PublicKey.from(publicKey),
            this.transformAccessKeyPermission(accessKey.permission)
          );
        }
        case "DeleteKey": {
          const { publicKey } = action.params;

          return nearTransactions.deleteKey(
            utils.PublicKey.from(publicKey)
          );
        }
        default: throw new Error("Invalid action");
      }
    });
  }

  validateAccessKey({ accessKey, transaction }: ValidateAccessKeyParams): boolean {
    if (accessKey.permission === "FullAccess") {
      return true;
    }

    const { receiver_id, method_names } = accessKey.permission.FunctionCall;

    if (transaction.receiverId !== receiver_id) {
      return false;
    }

    return transaction.actions.every((action) => {
      if (action.type !== "FunctionCall") {
        return false;
      }

      const { methodName, deposit } = action.params;

      if (method_names.length && method_names.includes(methodName)) {
        return false;
      }

      return parseFloat(deposit) <= 0;
    });
  }

  async signIn({ chainId, topic, contractId, methodNames, accounts }: SignInParams): Promise<Array<Account>> {
    if (!this.isAccountsValid(topic, accounts)) {
      throw new Error("Invalid accounts");
    }

    const result: Array<Account> = [];

    for (let i = 0; i < accounts.length; i += 1) {
      const account = accounts[i];

      try {
        await this.signAndSendTransaction({
          chainId,
          topic,
          transaction: {
            signerId: account.accountId,
            receiverId: account.accountId,
            actions: [{
              type: "AddKey",
              params: {
                publicKey: account.publicKey,
                accessKey: {
                  permission: {
                    receiverId: contractId,
                    methodNames,
                  },
                },
              },
            }]
          }
        });

        result.push(account);
      } catch (err) {
        console.log(`Failed to create FunctionCall access key for ${account.accountId}`);
        console.error(err);
      }
    }

    return result;
  }

  async signOut({ chainId, topic, accounts }: SignOutParams): Promise<Array<Account>> {
    if (!this.isAccountsValid(topic, accounts)) {
      throw new Error("Invalid accounts");
    }

    const result: Array<Account> = [];

    for (let i = 0; i < accounts.length; i += 1) {
      const account = accounts[i];

      try {
        await this.signAndSendTransaction({
          chainId,
          topic,
          transaction: {
            signerId: account.accountId,
            receiverId: account.accountId,
            actions: [{
              type: "DeleteKey",
              params: {
                publicKey: account.publicKey
              },
            }]
          }
        });
      } catch (err) {
        console.log(`Failed to remove FunctionCall access key for ${account.accountId}`);
        console.error(err);

        result.push(account);
      }
    }

    return result;
  }

  async getTransactionPermissions({
    chainId,
    topic,
    transaction
  }: GetTransactionPermissionParams): Promise<Array<TransactionPermission>> {
    const session = signClient.session.get(topic);
    const provider = new providers.JsonRpcProvider(NEAR_CHAINS[chainId as TNearChain].rpc);
    const keyStore = new nearKeyStores.BrowserLocalStorageKeyStore(window.localStorage, `${chainId}:${topic}:`);
    const accountIds = session.namespaces.near.accounts.map((x) => x.split(":")[2]);
    const networkId = chainId.split(":")[1];
    const permissions: Array<TransactionPermission> = [];

    // Ensure the signerId is valid based on the accounts we have access to.
    if (!accountIds.includes(transaction.signerId)) {
      return permissions;
    }

    // Use FunctionCall key store before falling back to FullAccess.
    const keyStores: Array<nearKeyStores.KeyStore> = [keyStore, this.vault];

    for (let i = 0 ; i < keyStores.length; i += 1) {
      const keyStore = keyStores[i];
      const keyPair = await keyStore.getKey(networkId, transaction.signerId);

      // Note: type for KeyStore.getKey is actually nullable.
      if (!keyPair) {
        continue;
      }

      const publicKey = keyPair.getPublicKey().toString();
      const accessKey = await provider.query<AccessKeyView>({
        request_type: "view_access_key",
        finality: "final",
        account_id: transaction.signerId,
        public_key: publicKey,
      });

      if (this.validateAccessKey({ accessKey, transaction })) {
        permissions.push({
          accessKey,
          signer: new InMemorySigner(keyStore),
        });
      }
    }

    return permissions;
  }

  async isElevatedPermission({
    chainId,
    topic,
    transactions
  }: IsElevatedPermissionParams) {
    const transactionsWithPermissions = await Promise.all(transactions.map(async (transaction) => ({
      transaction,
      permissions: await this.getTransactionPermissions({ chainId, topic, transaction }),
    })))

    return transactionsWithPermissions.some(({ permissions }) => {
      if (!permissions.length) {
        throw new Error("Failed to find matching access key for transaction");
      }

      return !permissions.some(({ accessKey }) => accessKey.permission !== "FullAccess");
    });
  }

  async signTransactions({
    chainId,
    topic,
    transactions
  }: SignTransactionsParams): Promise<Array<nearTransactions.SignedTransaction>> {
    const networkId = chainId.split(":")[1];
    const signer = new InMemorySigner(this.keyStore);
    const provider = new providers.JsonRpcProvider(NEAR_CHAINS[chainId as TNearChain].rpc);
    const signedTxs: Array<nearTransactions.SignedTransaction> = [];

    if (!this.isTransactionsValid(topic, transactions)) {
      throw new Error("Invalid transactions");
    }

    for (let i = 0; i < transactions.length; i += 1) {
      const transaction = transactions[i];

      const publicKey = await signer.getPublicKey(transaction.signerId, networkId);
      const [block, accessKey] = await Promise.all([
        provider.block({ finality: "final" }),
        provider.query<AccessKeyView>({
          request_type: "view_access_key",
          finality: "final",
          account_id: transactions[i].signerId,
          public_key: publicKey.toString(),
        }),
      ]);

      const tx = nearTransactions.createTransaction(
        transaction.signerId,
        publicKey,
        transaction.receiverId,
        accessKey.nonce + i + 1,
        this.transformActions(transaction.actions),
        utils.serialize.base_decode(block.header.hash)
      );

      const [, signedTx] = await nearTransactions.signTransaction(
        tx,
        signer,
        transaction.signerId,
        networkId
      );

      signedTxs.push(signedTx);
    }

    return signedTxs;
  }

  async signAndSendTransaction({
    chainId,
    topic,
    transaction
  }: SignAndSendTransactionParams): Promise<providers.FinalExecutionOutcome> {
    const provider = new providers.JsonRpcProvider(NEAR_CHAINS[chainId as TNearChain].rpc);
    const [signedTx] = await this.signTransactions({
      chainId,
      topic,
      transactions: [transaction]
    });

    return provider.sendTransaction(signedTx);
  }

  async signAndSendTransactions({
    chainId,
    topic,
    transactions
  }: SignAndSendTransactionsParams): Promise<Array<providers.FinalExecutionOutcome>> {
    const provider = new providers.JsonRpcProvider(NEAR_CHAINS[chainId as TNearChain].rpc);
    const signedTxs = await this.signTransactions({ chainId, topic, transactions });
    const results: Array<providers.FinalExecutionOutcome> = [];

    for (let i = 0; i < signedTxs.length; i += 1) {
      const signedTx = signedTxs[i];

      results.push(await provider.sendTransaction(signedTx));
    }

    return results;
  }
}
