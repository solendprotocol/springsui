import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

import BigNumber from "bignumber.js";
import { ExternalLink } from "lucide-react";

import BottomNav from "@/components/BottomNav";
import Card from "@/components/Card";
import Mask from "@/components/Mask";
import Nav from "@/components/Nav";
import TokenLogo from "@/components/TokenLogo";
import { AppData, useAppContext } from "@/contexts/AppContext";
import {
  NORMALIZED_ALPHA_COINTYPE,
  NORMALIZED_LST_COINTYPE,
  NORMALIZED_SUI_COINTYPE,
  isLst,
} from "@/lib/coinType";
import { formatPercent, formatUsd } from "@/lib/format";
import { shallowPushQuery } from "@/lib/router";
import { cn } from "@/lib/utils";

enum QueryParams {
  CATEGORY = "category",
}

export default function Defi() {
  const router = useRouter();
  const queryParams = {
    [QueryParams.CATEGORY]: router.query[QueryParams.CATEGORY] as
      | Category
      | undefined,
  };

  const appContext = useAppContext();
  const appData = appContext.appData as AppData;

  const suiToken = appData.coinMetadataMap[NORMALIZED_SUI_COINTYPE];
  const lstToken = appData.coinMetadataMap[NORMALIZED_LST_COINTYPE];

  // Categories
  enum Category {
    ALL = "all",
    DEX = "dex",
    LENDING = "lending",
    VAULT = "vault",
    FARMING = "farming",
  }

  const categories = [
    { id: Category.ALL, title: "All" },
    { id: Category.DEX, title: "DEX" },
    { id: Category.LENDING, title: "Lending" },
    { id: Category.VAULT, title: "Vault" },
    { id: Category.FARMING, title: "Farming" },
  ];

  const selectedCategory =
    queryParams[QueryParams.CATEGORY] &&
    Object.values(Category).includes(queryParams[QueryParams.CATEGORY])
      ? queryParams[QueryParams.CATEGORY]
      : Category.ALL;
  const onSelectedCategoryChange = (category: Category) => {
    shallowPushQuery(router, {
      ...router.query,
      [QueryParams.CATEGORY]: category,
    });
  };

  // Opportunities
  const opportunities = [
    {
      protocol: {
        name: "Aftermath",
        logoUrl: null,
      },
      title: "Lend on Suilend",
      url: `https://suilend.fi/dashboard?asset=${lstToken.symbol}`,
      assets: [{ coinType: NORMALIZED_LST_COINTYPE, symbol: lstToken.symbol }],
      aprPercent: new BigNumber(2.65),
      tvlUsd: new BigNumber(1540000),
      category: Category.LENDING,
    },
    {
      protocol: {
        name: "Alpha Fi",
        logoUrl: null,
      },
      title: "Deposit on Alpha Fi",
      url: "https://alphafi.xyz/portfolio",
      assets: [
        { coinType: NORMALIZED_ALPHA_COINTYPE, symbol: "ALPHA" },
        { coinType: NORMALIZED_LST_COINTYPE, symbol: lstToken.symbol },
      ],
      aprPercent: new BigNumber(301.08),
      tvlUsd: new BigNumber(278522),
      category: Category.VAULT,
    },
  ];

  return (
    <>
      <Nav />

      {/* Fixed, WIDTH >= md */}
      <Mask />

      <div className="relative z-[1] flex w-full flex-col items-center px-4 pb-12 pt-4 md:px-10 md:py-20">
        <div className="flex w-full max-w-xl flex-col items-center gap-4">
          <Card>
            {/* Categories */}
            <div className="flex w-full flex-row flex-nowrap gap-2 overflow-x-auto p-2 md:px-4 md:py-3.5">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={cn(
                    "group flex h-10 flex-row items-center gap-2 rounded-[20px] border px-4 transition-colors",
                    selectedCategory === category.id
                      ? "border-white bg-white"
                      : "border-navy-200 hover:bg-navy-200/25",
                  )}
                  onClick={() => onSelectedCategoryChange(category.id)}
                >
                  <p
                    className={cn(
                      "!text-p2 transition-colors",
                      selectedCategory === category.id
                        ? "text-foreground"
                        : "text-navy-600 group-hover:text-foreground",
                    )}
                  >
                    {category.title}
                  </p>
                  <p
                    className={cn(
                      "!text-p3 transition-colors",
                      selectedCategory === category.id
                        ? "text-foreground"
                        : "text-navy-600 group-hover:text-foreground",
                    )}
                  >
                    {category.id === Category.ALL
                      ? opportunities.length
                      : opportunities.filter(
                          (opportunity) => opportunity.category === category.id,
                        ).length}
                  </p>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-white/75" />

            {/* Opportunities */}
            <div className="flex w-full flex-col gap-0.5 p-2 md:p-4">
              {opportunities.map((opportunity, index) => (
                <div
                  key={index}
                  className="flex w-full flex-col gap-4 rounded-md bg-white p-4 md:gap-5 md:p-5"
                >
                  <div className="flex w-full flex-row items-center gap-2">
                    {opportunity.protocol.logoUrl ? (
                      <Image
                        src={opportunity.protocol.logoUrl}
                        alt={`${opportunity.protocol.name} logo`}
                        width={28}
                        height={28}
                      />
                    ) : (
                      <div className="h-7 w-7 rounded-[50%] bg-navy-100" />
                    )}
                    <p className="text-p1 md:text-h3">{opportunity.title}</p>

                    {opportunity.url && (
                      <Link
                        className="block flex flex-col justify-center text-navy-400 transition-colors hover:text-navy-600"
                        target="_blank"
                        href={opportunity.url}
                      >
                        <ExternalLink className="h-5 w-5" />
                      </Link>
                    )}
                  </div>

                  <div className="grid w-full grid-cols-2 justify-between gap-y-6 md:flex md:flex-row md:gap-0">
                    {/* Assets */}
                    <div className="flex min-w-20 flex-col gap-1.5">
                      <p className="text-p2 text-navy-500">Assets</p>

                      <div className="flex w-full flex-row items-center gap-1.5">
                        <div className="flex flex-row">
                          {opportunity.assets.map((a, index) => (
                            <TokenLogo
                              key={a.coinType}
                              className={cn(
                                index !== 0 &&
                                  "outline-px -ml-2 outline outline-white",
                              )}
                              token={
                                isLst(a.coinType)
                                  ? lstToken
                                  : {
                                      // TODO
                                      coinType: a.coinType,
                                      decimals: 0,
                                      description: "",
                                      iconUrl: "",
                                      name: "",
                                      symbol: a.symbol,
                                    }
                              }
                              size={24}
                            />
                          ))}
                        </div>

                        <p className="text-p2">
                          {opportunity.assets.map((a) => a.symbol).join("-")}
                        </p>
                      </div>
                    </div>

                    {/* APR */}
                    <div className="flex min-w-20 flex-col gap-1.5">
                      <p className="text-p2 text-navy-500">APR</p>
                      <p>{formatPercent(opportunity.aprPercent)}</p>
                    </div>

                    {/* TVL */}
                    <div className="flex min-w-20 flex-col gap-1.5">
                      <p className="text-p2 text-navy-500">TVL</p>
                      <p>{formatUsd(opportunity.tvlUsd)}</p>
                    </div>

                    {/* Category */}
                    <div className="flex min-w-20 flex-col gap-1.5">
                      <p className="text-p2 text-navy-500">Category</p>
                      <p>
                        {
                          categories.find((c) => c.id === opportunity.category)
                            ?.title
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* WIDTH < md */}
      <BottomNav />
    </>
  );
}
