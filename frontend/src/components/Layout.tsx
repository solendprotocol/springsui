import { PropsWithChildren } from "react";

import { Loader2 } from "lucide-react";

import { useAppContext } from "@/contexts/AppContext";

export default function Layout({ children }: PropsWithChildren) {
  const { lstClient, appData } = useAppContext();

  return (
    <>
      {/* Fixed */}
      <div
        className="fixed inset-0 z-[1] bg-bg"
        style={{
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
        }}
      />

      <div className="relative z-[2] h-dvh">
        {!lstClient || !appData ? (
          <div className="fixed inset-0 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          children
        )}
      </div>
    </>
  );
}