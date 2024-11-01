import localFont from "next/font/local";

const font = localFont({
  variable: "--general-sans",
  src: [
    {
      path: "../fonts/GeneralSans-Variable.ttf",
      weight: "500 600",
    },
  ],
});

export const fontClassNames = [font.className, font.variable];
