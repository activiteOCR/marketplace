import type { AppProps } from "next/app";
import { ChainId, ThirdwebProvider } from "@thirdweb-dev/react";
import "../styles/globals.css";
import Head from "next/head";
import Header from "../components/Header";
import { Analytics } from '@vercel/analytics/react';

// This is the chainId your dApp will work on.
const activeChainId = ChainId.Goerli;

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThirdwebProvider desiredChainId={activeChainId}>
      <Head>
        <title>thirdweb Marketplace with Next.JS</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="description"
          content="Internal marketplace for Meg4mint holders, Buy WL for NFTs P2E and P&E with $MEG utility token"
        />
        <meta
          name="keywords"
          content="Meg4mint, Meg4mint Marketplace, Holders utility, WL NFT Rental, Utility Token"
        />
      </Head>
      <Header />
      <Component {...pageProps} />
      <Analytics />
    </ThirdwebProvider>
  );
}

export default MyApp;
