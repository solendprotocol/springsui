import { normalizeStructTag } from "@mysten/sui/utils";

export const LIQUID_STAKING_INFO = {
  id: "0x15eda7330c8f99c30e430b4d82fd7ab2af3ead4ae17046fcb224aa9bad394f6b",
  type: "0x83556891f4a0f233ce7b05cfe7f957d4020492a34f5405b2cb9377d060bef4bf::spring_sui::SPRING_SUI",
};

const SEND_POINTS_COINTYPE =
  "0x34fe4f3c9e450fed4d0a3c587ed842eec5313c30c3cc3c0841247c49425e246b::suilend_point::SUILEND_POINT";
const SUI_COINTYPE = "0x2::sui::SUI";
const LST_COINTYPE = LIQUID_STAKING_INFO.type;

export const NORMALIZED_SEND_POINTS_COINTYPE =
  normalizeStructTag(SEND_POINTS_COINTYPE);
export const NORMALIZED_SUI_COINTYPE = normalizeStructTag(SUI_COINTYPE);
export const NORMALIZED_LST_COINTYPE = normalizeStructTag(LST_COINTYPE);

// 128x128
export const COINTYPE_LOGO_MAP = {
  [NORMALIZED_SEND_POINTS_COINTYPE]:
    "data:image/png;base64,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",
  [NORMALIZED_SUI_COINTYPE]:
    "data:image/png;base64,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",
  [NORMALIZED_LST_COINTYPE]:
    "data:image/png;base64,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",
};

export const COINTYPE_SYMBOL_MAP: Record<string, string> = {
  [NORMALIZED_SEND_POINTS_COINTYPE]: "SEND Points",
};

export const extractSymbolFromCoinType = (coinType: string) =>
  coinType.split("::").at(-1);

export const isSendPoints = (coinType: string) =>
  normalizeStructTag(coinType) === NORMALIZED_SEND_POINTS_COINTYPE;
export const isSui = (coinType: string) =>
  normalizeStructTag(coinType) === NORMALIZED_SUI_COINTYPE;
export const isLst = (coinType: string) =>
  normalizeStructTag(coinType) === NORMALIZED_LST_COINTYPE;

export const isCoinType = (text: string) => {
  if (text.includes("-")) return false;
  try {
    normalizeStructTag(text);
    return true;
  } catch (err) {}
  return false;
};
