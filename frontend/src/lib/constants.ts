export const msPerYear = 31556952000; // Approx. 1000 * 60 * 60 * 24 * 365;

export const TWITTER = "@springsui_";

export const TITLE = "SpringSui | Infinitely liquid staking on Sui";
export const DESCRIPTION =
  "Stake SUI with SpringSui and access the power of DeFi with sSUI, our flagship LST. With SpringSui’s liquid staking, you can stake SUI and hold sSUI to earn yield while maintaining flexibility. Maximize your DeFi opportunities and enjoy rewards with sSUI, the LST that brings unmatched liquidity to Sui!";

export const TOAST_DURATION_MS = 4 * 1000;
export const TX_TOAST_DURATION_MS = 10 * 1000;

export const SUI_GAS_MIN = 0.05;

export const RPC = {
  name: "Triton One",
  url: `https://solendf-suishar-0c55.mainnet.sui.rpcpool.com/${
    process.env.NEXT_PUBLIC_SUI_TRITON_ONE_DEV_API_KEY ?? ""
  }`,
};

export const EXPLORER = {
  name: "Suiscan",
  buildAddressUrl: (address: string) =>
    `https://suiscan.xyz/mainnet/account/${address}`,
  buildObjectUrl: (id: string) => `https://suiscan.xyz/mainnet/object/${id}`,
  buildCoinUrl: (coinType: string) =>
    `https://suiscan.xyz/mainnet/coin/${coinType}`,
  buildTxUrl: (digest: string) => `https://suiscan.xyz/mainnet/tx/${digest}`,
};
