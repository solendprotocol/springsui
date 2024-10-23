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
        name: "Suilend",
        logoUrl: "https://suilend.fi/assets/suilend.svg",
      },
      title: "Lend on Suilend",
      url: `https://suilend.fi/dashboard?asset=${lstToken.symbol}`,
      assets: [{ coinType: NORMALIZED_LST_COINTYPE, symbol: lstToken.symbol }],
      aprPercent: new BigNumber(0), // TODO
      tvlUsd: new BigNumber(0), // TODO
      category: Category.LENDING,
    },
  ];

  return (
    <>
      <Nav />

      {/* Fixed, WIDTH >= md */}
      <Mask />

      <div className="relative z-[1] flex w-full flex-col items-center px-4 pb-12 pt-4 md:px-10 md:py-20">
        <div className="flex w-full max-w-2xl flex-col items-center gap-8">
          <div className="flex w-full flex-col items-center gap-2">
            <p className="text-center text-h1">Explore DeFi</p>
            <p className="text-center text-navy-600">
              <span className="whitespace-nowrap">
                Discover rewards and DeFi
              </span>{" "}
              <span className="whitespace-nowrap">
                opportunities with your sSUI.
              </span>
            </p>
          </div>

          <Card>
            {/* Categories */}
            <div className="flex w-full flex-row flex-nowrap gap-2 overflow-x-auto p-2 md:px-4 md:py-3.5">
              {categories
                .filter(
                  (category) =>
                    category.id === Category.ALL ||
                    opportunities.filter(
                      (opportunity) => opportunity.category === category.id,
                    ).length > 0,
                )
                .map((category) => (
                  <button
                    key={category.id}
                    className={cn(
                      "group flex h-10 flex-row items-center gap-2 rounded-[20px] px-4 transition-colors",
                      selectedCategory === category.id
                        ? "bg-white"
                        : "bg-white/25",
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
                            (opportunity) =>
                              opportunity.category === category.id,
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
                  <Link
                    className="group flex w-max flex-row items-center gap-2"
                    target="_blank"
                    href={opportunity.url}
                  >
                    {opportunity.protocol.logoUrl ? (
                      <Image
                        className="rounded-[50%]"
                        src={opportunity.protocol.logoUrl}
                        alt={`${opportunity.protocol.name} logo`}
                        width={28}
                        height={28}
                        quality={100}
                      />
                    ) : (
                      <div className="h-7 w-7 rounded-[50%] bg-navy-100" />
                    )}
                    <p className="text-p1 md:text-h3">{opportunity.title}</p>

                    <ExternalLink className="h-5 w-5 text-navy-600 transition-colors group-hover:text-foreground" />
                  </Link>

                  <div className="grid w-full grid-cols-2 justify-between gap-x-4 gap-y-6 md:flex md:flex-row md:gap-0">
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
                                      iconUrl:
                                        "https://assets.coingecko.com/coins/images/32391/standard/coin_icon_afsui.png?1698051868",
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
                      <p className="text-p2 leading-6">
                        {formatPercent(opportunity.aprPercent)}
                      </p>
                    </div>

                    {/* TVL */}
                    <div className="flex min-w-20 flex-col gap-1.5">
                      <p className="text-p2 text-navy-500">TVL</p>
                      <p className="text-p2 leading-6">
                        {formatUsd(opportunity.tvlUsd)}
                      </p>
                    </div>

                    {/* Category */}
                    <div className="flex min-w-20 flex-col gap-1.5">
                      <p className="text-p2 text-navy-500">Category</p>
                      <p className="text-p2 leading-6">
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
