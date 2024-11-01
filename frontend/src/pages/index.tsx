import { useRouter } from "next/router";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { Transaction } from "@mysten/sui/transactions";
import * as Sentry from "@sentry/react";
import BigNumber from "bignumber.js";
import { Info, Wallet } from "lucide-react";

import { LstClient } from "@suilend/springsui-sdk";

import Card from "@/components/Card";
import FaqPopover, { FaqContent } from "@/components/FaqPopover";
import { FOOTER_MD_HEIGHT, FooterSm } from "@/components/Footer";
import StakeInput from "@/components/Input";
import StatsPopover, { StatsContent } from "@/components/StatsPopover";
import SubmitButton from "@/components/SubmitButton";
import TokenLogo from "@/components/TokenLogo";
import Tooltip from "@/components/Tooltip";
import TransactionConfirmationDialog, {
  TransactionConfirmationDialogConfig,
} from "@/components/TransactionConfirmationDialog";
import { AppData, useAppDataContext } from "@/contexts/AppDataContext";
import { useRootContext } from "@/contexts/RootContext";
import { useWalletContext } from "@/contexts/WalletContext";
import {
  NORMALIZED_LST_COINTYPE,
  NORMALIZED_SEND_POINTS_COINTYPE,
  NORMALIZED_SUI_COINTYPE,
} from "@/lib/coinType";
import { SUI_GAS_MIN } from "@/lib/constants";
import {
  formatInteger,
  formatPercent,
  formatPoints,
  formatToken,
} from "@/lib/format";
import { shallowPushQuery } from "@/lib/router";
import { errorToast, successToast } from "@/lib/toasts";
import track from "@/lib/track";
import { getBalanceChange, mint, redeem } from "@/lib/transactions";
import { SubmitButtonState } from "@/lib/types";
import { cn } from "@/lib/utils";

enum QueryParams {
  TAB = "tab",
}

export default function Home() {
  const router = useRouter();
  const queryParams = {
    [QueryParams.TAB]: router.query[QueryParams.TAB] as Tab | undefined,
  };

  const { suiClient, explorer, ...restRootContext } = useRootContext();
  const lstClient = restRootContext.lstClient as LstClient;
  const { refreshAppData, ...restAppDataContext } = useAppDataContext();
  const appData = restAppDataContext.appData as AppData;
  const {
    setIsConnectWalletDropdownOpen,
    address,
    signExecuteAndWaitForTransaction,
    refreshBalancesData,
    getAccountBalance,
  } = useWalletContext();

  const suiToken = appData.tokenMap[NORMALIZED_SUI_COINTYPE];
  const lstToken = appData.tokenMap[NORMALIZED_LST_COINTYPE];

  // Ref
  const inInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inInputRef.current?.focus();
  }, []);

  // Tabs
  enum Tab {
    STAKE = "stake",
    UNSTAKE = "unstake",
  }

  const tabs = [
    { id: Tab.STAKE, title: "Stake" },
    { id: Tab.UNSTAKE, title: "Unstake" },
  ];

  const selectedTab =
    queryParams[QueryParams.TAB] &&
    Object.values(Tab).includes(queryParams[QueryParams.TAB])
      ? queryParams[QueryParams.TAB]
      : Tab.STAKE;
  const onSelectedTabChange = (tab: Tab) => {
    shallowPushQuery(router, { ...router.query, [QueryParams.TAB]: tab });
    inInputRef.current?.focus();
  };

  const isStaking = selectedTab === Tab.STAKE;

  // Stats
  const inToOutExchangeRate = isStaking
    ? appData.liquidStakingInfo.suiToLstExchangeRate
    : appData.liquidStakingInfo.lstToSuiExchangeRate;

  // Balance
  const suiBalance = getAccountBalance(suiToken.coinType);
  const lstBalance = getAccountBalance(lstToken.coinType);

  const inBalance = isStaking ? suiBalance : lstBalance;
  const outBalance = isStaking ? lstBalance : suiBalance;

  // In
  const inTitle = isStaking ? "Stake" : "Unstake";
  const inToken = isStaking ? suiToken : lstToken;
  const inPrice = isStaking ? appData.suiPrice : appData.lstPrice;

  const [inValue, setInValue] = useState<string>("");
  const inValueUsd = new BigNumber(BigNumber.max(0, inValue || 0)).times(
    inPrice,
  );

  const formatAndSetInValue = useCallback(
    (_value: string) => {
      let formattedValue;
      if (new BigNumber(_value || 0).lt(0)) formattedValue = _value;
      else if (!_value.includes(".")) formattedValue = _value;
      else {
        const [integers, decimals] = _value.split(".");
        const integersFormatted = formatInteger(
          integers !== "" ? parseInt(integers) : 0,
          false,
        );
        const decimalsFormatted = decimals.slice(
          0,
          Math.min(decimals.length, inToken.decimals),
        );
        formattedValue = `${integersFormatted}.${decimalsFormatted}`;
      }

      setInValue(formattedValue);
    },
    [inToken.decimals],
  );

  const maxInValue = isStaking
    ? BigNumber.max(0, inBalance.minus(SUI_GAS_MIN))
    : inBalance;

  const onInBalanceClick = () => {
    formatAndSetInValue(
      (isStaking ? BigNumber.max(0, inBalance.minus(1)) : inBalance).toFixed(
        inToken.decimals,
        BigNumber.ROUND_DOWN,
      ),
    );
    inInputRef.current?.focus();
  };

  // Out
  const outToken = isStaking ? lstToken : suiToken;
  const outPrice = isStaking ? appData.lstPrice : appData.suiPrice;

  const outValue =
    inValue === ""
      ? ""
      : formatToken(
          BigNumber.max(0, inValue)
            .times(inToOutExchangeRate)
            .times(
              new BigNumber(1).minus(
                (isStaking
                  ? appData.liquidStakingInfo.mintFeePercent
                  : appData.liquidStakingInfo.redeemFeePercent
                ).div(100),
              ),
            ),
          {
            dp: outToken.decimals,
            useGrouping: false,
            roundLtMinToZero: true,
          },
        );
  const outValueUsd = new BigNumber(outValue || 0).times(outPrice);

  // Submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [
    isTransactionConfirmationDialogOpen,
    setIsTransactionConfirmationDialogOpen,
  ] = useState<boolean>(false);

  const getTransactionConfirmationDialogConfig =
    (): TransactionConfirmationDialogConfig => {
      return { isStaking, inToken, outToken, inValue, outValue };
    };
  const [
    transactionConfirmationDialogConfig,
    setTransactionConfirmationDialogConfig,
  ] = useState<TransactionConfirmationDialogConfig>(
    getTransactionConfirmationDialogConfig,
  );

  const getSubmitButtonState = (): SubmitButtonState => {
    if (!address)
      return {
        icon: <Wallet />,
        title: "Connect wallet",
        onClick: () => setIsConnectWalletDropdownOpen(true),
      };
    if (isSubmitting) return { isLoading: true, isDisabled: true };

    if (new BigNumber(inValue || 0).lte(0))
      return { title: "Enter an amount", isDisabled: true };
    if (new BigNumber(inValue).gt(inBalance))
      return { title: "Insufficient balance", isDisabled: true };
    if (isStaking && new BigNumber(inValue).gt(maxInValue))
      return {
        title: `${SUI_GAS_MIN} SUI should be saved for gas`,
        isDisabled: true,
      };
    if (new BigNumber(outValue).lte(0))
      return { title: "Amount too low", isDisabled: true };

    return {
      title: `${inTitle} ${formatToken(new BigNumber(inValue), { dp: inToken.decimals })} ${inToken.symbol}`,
    };
  };
  const submitButtonState = getSubmitButtonState();

  const submit = async () => {
    if (submitButtonState.isDisabled) return;

    setIsSubmitting(true);
    setTransactionConfirmationDialogConfig(
      getTransactionConfirmationDialogConfig(),
    );

    const submitAmount = new BigNumber(inValue)
      .times(10 ** inToken.decimals)
      .integerValue(BigNumber.ROUND_DOWN)
      .toString();

    const transaction = new Transaction();
    try {
      if (isStaking) mint(lstClient, transaction, address!, submitAmount);
      else
        await redeem(suiClient, lstClient, transaction, address!, submitAmount);
    } catch (err) {
      Sentry.captureException(err);
      console.error(err);
      throw err;
    }

    try {
      setIsTransactionConfirmationDialogOpen(true);

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      const balanceChangeIn = getBalanceChange(res, address!, inToken, -1);
      const balanceChangeOut = getBalanceChange(res, address!, outToken);

      successToast(
        [
          isStaking ? "Staked" : "Unstaked",
          formatToken(
            balanceChangeIn !== undefined
              ? balanceChangeIn
              : new BigNumber(inValue),
            { dp: inToken.decimals },
          ),
          inToken.symbol,
        ].join(" "),
        [
          "Received",
          formatToken(
            balanceChangeOut !== undefined
              ? balanceChangeOut
              : new BigNumber(outValue),
            { dp: outToken.decimals },
          ),
          outToken.symbol,
        ].join(" "),
        txUrl,
      );
      formatAndSetInValue("");

      track(isStaking ? "stake" : "unstake", {
        amountIn: inValue,
        amountInUsd: inValueUsd.toFixed(2, BigNumber.ROUND_DOWN),
        amountOut: outValue,
        amountOutUsd: outValueUsd.toFixed(2, BigNumber.ROUND_DOWN),
      });
    } catch (err) {
      errorToast(
        `Failed to ${isStaking ? "stake" : "unstake"}`,
        err as Error,
        true,
      );
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setIsTransactionConfirmationDialogOpen(false);

      inInputRef.current?.focus();
      await refreshAppData();
      await refreshBalancesData();
    }
  };

  // Parameters
  type Parameter = {
    labelStartDecorator?: ReactNode;
    label: string;
    labelEndDecorator?: ReactNode;
    valueStartDecorator?: ReactNode;
    value: string;
    valueEndDecorator?: ReactNode;
  };

  const parameters: Parameter[] = [
    {
      label: "Exchange rate",
      value: `1 ${inToken.symbol} ≈ ${formatToken(new BigNumber(inToOutExchangeRate), { dp: 3 })} ${outToken.symbol}`,
    },
    {
      label: isStaking ? "Staking fee" : "Unstaking fee",
      value: formatPercent(
        isStaking
          ? appData.liquidStakingInfo.mintFeePercent
          : appData.liquidStakingInfo.redeemFeePercent,
      ),
    },
    // {
    //   label: "Spread fee",
    //   value: formatPercent(appData.liquidStakingInfo.spreadFeePercent),
    // },
  ];
  if (isStaking)
    parameters.push(
      {
        label: "APR",
        value: formatPercent(appData.liquidStakingInfo.aprPercent),
      },
      {
        label: "Est. yearly earnings",
        value: `${
          inValue === ""
            ? "--"
            : formatToken(
                new BigNumber(BigNumber.max(0, inValue || 0)).times(
                  appData.liquidStakingInfo.aprPercent.div(100),
                ),
              )
        } ${inToken.symbol}`,
      },
      {
        label: "SEND Points",
        labelEndDecorator: (
          <Tooltip
            title={`SEND Points are earned by depositing ${lstToken.symbol} in Suilend`}
          >
            <Info className="h-4 w-4 text-navy-600" />
          </Tooltip>
        ),
        valueStartDecorator: (
          <TokenLogo
            token={appData.tokenMap[NORMALIZED_SEND_POINTS_COINTYPE]}
            size={16}
          />
        ),
        value: `${outValue === "" ? "--" : formatPoints(new BigNumber(outValue || 0).times(appData.lstReserveSendPointsPerDay), { dp: 3 })} / day`,
      },
    );

  return (
    <>
      {/* Fixed */}
      <TransactionConfirmationDialog
        isOpen={isTransactionConfirmationDialogOpen}
        config={transactionConfirmationDialogConfig}
      />

      <div className="relative z-[1] flex w-full flex-col items-center px-4 pt-4 md:px-10 md:py-20">
        <div className="flex w-full max-w-md flex-col items-center gap-8">
          <div className="flex w-full flex-col gap-4">
            <Card>
              {/* Tabs */}
              <div className="w-full p-2 md:px-4 md:py-3.5">
                <div className="flex w-full flex-row rounded-sm bg-white/25 md:rounded-md">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      className={cn(
                        "group h-10 flex-1 rounded-sm transition-colors md:rounded-md",
                        selectedTab === tab.id && "bg-white",
                      )}
                      onClick={() => onSelectedTabChange(tab.id)}
                    >
                      <p
                        className={cn(
                          "!text-p2 transition-colors",
                          selectedTab === tab.id
                            ? "text-foreground"
                            : "text-navy-600 group-hover:text-foreground",
                        )}
                      >
                        {tab.title}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px w-full bg-white/75" />

              {/* Form */}
              <div className="flex w-full flex-col gap-2 p-2 md:gap-4 md:p-4">
                <StakeInput
                  ref={inInputRef}
                  token={inToken}
                  title={inTitle}
                  value={inValue}
                  onChange={formatAndSetInValue}
                  usdValue={inValueUsd}
                  onBalanceClick={onInBalanceClick}
                />

                <StakeInput
                  token={outToken}
                  title="Receive"
                  value={outValue}
                  usdValue={outValueUsd}
                />

                <SubmitButton state={submitButtonState} submit={submit} />
              </div>
            </Card>

            {/* Parameters */}
            <div className="flex w-full flex-col gap-4 px-2 md:px-4">
              {parameters.map((param) => (
                <div
                  key={param.label}
                  className="flex w-full flex-row items-center justify-between"
                >
                  <div className="flex flex-row items-center gap-1.5">
                    {param.labelStartDecorator}
                    <p className="text-p2 text-navy-600">{param.label}</p>
                    {param.labelEndDecorator}
                  </div>
                  <div className="flex flex-row items-center gap-1.5">
                    {param.valueStartDecorator}
                    <p className="text-p2">{param.value}</p>
                    {param.valueEndDecorator}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats and FAQ, WIDTH < md */}
          <div className="flex w-full flex-col gap-6 md:hidden">
            <div className="flex w-full flex-col gap-4 rounded-lg border border-white/75 bg-white/20 p-4 backdrop-blur-[10px]">
              <StatsContent />
            </div>

            <div className="flex w-full flex-col gap-4 rounded-lg border border-white/75 bg-white/20 p-4 backdrop-blur-[10px]">
              <FaqContent />
            </div>
          </div>

          {/* WIDTH < md */}
          <FooterSm />
        </div>
      </div>

      {/* Fixed, WIDTH >= md */}
      <div
        className="fixed z-[2] max-md:hidden"
        style={{ left: 8 + 32, bottom: FOOTER_MD_HEIGHT + 32 }}
      >
        <StatsPopover />
      </div>

      {/* Fixed, WIDTH >= md */}
      <div
        className="fixed z-[2] max-md:hidden"
        style={{ right: 8 + 32, bottom: FOOTER_MD_HEIGHT + 32 }}
      >
        <FaqPopover />
      </div>
    </>
  );
}
