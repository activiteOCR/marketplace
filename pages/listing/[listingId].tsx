import {
  MediaRenderer,
  useNetwork,
  useNetworkMismatch,
  useListing,
  useContract,
  useAddress,
  //useContractWrite,
} from "@thirdweb-dev/react";
import {
  ChainId,
} from "@thirdweb-dev/sdk";
import { useState } from "react";
import axios from "axios";
//import { assert } from "console";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { marketplaceContractAddress, tokenContractAddress, stakContractAddress, coldWalletAddress } from "../../addresses";
import styles from "../../styles/Home.module.css";

const ListingPage: NextPage = () => {
  // Next JS Router hook to redirect to other pages and to grab the query from the URL (listingId)
  const router = useRouter();

  // De-construct listingId out of the router.query.
  // This means that if the user visits /listing/0 then the listingId will be 0.
  // If the user visits /listing/1 then the listingId will be 1.
  const { listingId } = router.query as { listingId: string };

  // Hooks to detect user is on the right network and switch them if they are not
  const networkMismatch = useNetworkMismatch();
  const [, switchNetwork] = useNetwork();
  const [quantity, setQuantity] = useState(1);

  // Initialize the marketplace contract
  const { contract: marketplace } = useContract(marketplaceContractAddress, "marketplace");

  // Initialize the token contract
  const { contract: megToken } = useContract(tokenContractAddress, "token");

  // Initialize the NFT stake contract
  //const { contract } = useContract("0x8449fdbC894F25F4754366165684f8119Fc63406");
  //const { mutateAsync: depositRewardTokens, isLoading } = useContractWrite(contract, "depositRewardTokens")

  const address = useAddress();

  // Fetch the listing from the marketplace contract
  const { data: listing, isLoading: loadingListing } = useListing(
    marketplace,
    listingId
  );

  if (loadingListing) {
    return <div className={styles.loadingOrError}>Loading...</div>;
  }

  if (!listing) {
    return <div className={styles.loadingOrError}>Listing not found</div>;
  }

  async function buyNft(
    rental_duration: number,
    amount: number,
  ) {
    try {
      // Ensure user is on the correct network
      if (networkMismatch) {
        switchNetwork && switchNetwork(ChainId.Goerli);
        return;
      }

       // Address of the wallet who bought the WL
      const fromAddress = String(address);
      // Address of the wallet you want to send the tokens to
      const toAddress = stakContractAddress;

      // Work only for owner of Token contract
      // await megToken?.transfer(toAddress, amount);
      // await megToken?.setAllowance(toAddress, amount);
      
      //depositReward to refund NFT stake
      //await depositRewardTokens([ amount ]);

      // Transfer token to cold wallet (ledger)
      const transactionResponse = await megToken?.transfer(coldWalletAddress, amount);

      const blockNumber = transactionResponse?.receipt.blockNumber;

      const res = await axios.post('https://meg4min-back.onrender.com/api/participate', {
        block: blockNumber,
        wallet: fromAddress,
        rental_duration: rental_duration,
        item_name: listing?.asset.name,
        image: listing?.asset.image,
        rental_url: listing?.asset.external_url,
    });
      
      alert("WL bought successfully!");
    } catch (error) {
      console.error(error);
      alert(error);
    }
  }

  return (
    <div className={styles.container} style={{}}>
      <div className={styles.listingContainer}>
        <div className={styles.leftListing}>
          <MediaRenderer
            src={listing.asset.image}
            className={styles.mainNftImage}
          />
        </div>

        <div className={styles.mintAreaRight}>
          <h1>{listing.asset.name}</h1>
          <p>Cycle</p>
            <div className={styles.quantityContainer}>
              <button
                className={`${styles.quantityControlButton}`}
                onClick={() => setQuantity(quantity - 1)}
                disabled={quantity <= 1}
              >
                -
              </button>

              <h4>{quantity}</h4>

              <button
                className={`${styles.quantityControlButton}`}
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </button>
            </div>
          <h2>
            <b>{quantity * Number(listing.buyoutCurrencyValuePerToken.displayValue)}</b>{" "}
            {listing.buyoutCurrencyValuePerToken.symbol}
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 20,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <button
              style={{ borderStyle: "none" }}
              className={styles.mainButton}
              onClick={() => buyNft(quantity, quantity * Number(listing.buyoutCurrencyValuePerToken.displayValue))}

            >
              Buy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingPage;
