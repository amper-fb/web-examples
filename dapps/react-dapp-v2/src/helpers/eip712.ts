// From spec: https://eips.ethereum.org/EIPS/eip-712
const example = {
  types: {
    EIP712Domain: [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
      { name: "verifyingContract", type: "address" },
    ],
    Person: [
      { name: "name", type: "string" },
      { name: "wallet", type: "address" },
    ],
    Mail: [
      { name: "from", type: "Person" },
      { name: "to", type: "Person" },
      { name: "contents", type: "string" },
    ],
  },
  primaryType: "Mail",
  domain: {
    name: "Ether Mail",
    version: "1",
    chainId: 1,
    verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
  },
  message: {
    from: { name: "Cow", wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826" },
    to: { name: "Bob", wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB" },
    contents: "Hello, Bob!",
  },
};

const permit = {
    "types": {
        "Permit": [
            {
                "name": "owner",
                "type": "address"
            },
            {
                "name": "spender",
                "type": "address"
            },
            {
                "name": "value",
                "type": "uint256"
            },
            {
                "name": "nonce",
                "type": "uint256"
            },
            {
                "name": "deadline",
                "type": "uint256"
            }
        ],
        "EIP712Domain": [
            {
                "name": "name",
                "type": "string"
            },
            {
                "name": "version",
                "type": "string"
            },
            {
                "name": "chainId",
                "type": "uint256"
            },
            {
                "name": "verifyingContract",
                "type": "address"
            }
        ]
    },
    "domain": {
        "name": "Aave Polygon DAI",
        "chainId": 137,
        "version": "1",
        "verifyingContract": "0x82E64f49Ed5EC1bC6e43DAD4FC8Af9bb3A2312EE"
    },
    "message": {
        "nonce": 0,
        "owner": "0xf329388f83c02c29f0080493ba21dcc90d17acc5",
        "value": "54595691248820214000000",
        "spender": "0x6a4b2b595d369c963493Fc704CF48e42FAd8260b",
        "deadline": "1677130875"
    },
    "primaryType": "Permit"
};

const permitSingle =
{
  "types": {
    "EIP712Domain": [
      {
        "name": "name",
        "type": "string"
      },
      {
        "name": "chainId",
        "type": "uint256"
      },
      {
        "name": "verifyingContract",
        "type": "address"
      }
    ],
    "PermitSingle": [
      {
        "name": "details",
        "type": "PermitDetails"
      },
      {
        "name": "spender",
        "type": "address"
      },
      {
        "name": "sigDeadline",
        "type": "uint256"
      }
    ],
    "PermitDetails": [
      {
        "name": "token",
        "type": "address"
      },
      {
        "name": "amount",
        "type": "uint160"
      },
      {
        "name": "expiration",
        "type": "uint48"
      },
      {
        "name": "nonce",
        "type": "uint48"
      }
    ]
  },
  "domain": {
    "name": "Permit2",
    "chainId": "1",
    "verifyingContract": "0x000000000022d473030f116ddee9f6b43ac78ba3"
  },
  "message": {
    "details": {
      "nonce": "0",
      "token": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      "amount": "1461501637330902918203684832716283019655932542975",
      "expiration": "1681479506"
    },
    "spender": "0xef1c6e67703c7bd7107eed8303fbe6ec2554bf6b",
    "sigDeadline": "1678889306"
  },
  "primaryType": "PermitSingle"
};


export const eip712 = {
  example,
  permit,
  permitSingle
};
