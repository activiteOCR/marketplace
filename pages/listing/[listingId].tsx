import {
  MediaRenderer,
  useNetwork,
  useNetworkMismatch,
  useListing,
  useContract,
  useAddress,
  useContractWrite,
} from "@thirdweb-dev/react";
import {
  ChainId,
} from "@thirdweb-dev/sdk";
import { useState } from "react";
import axios from "axios";
import { assert } from "console";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { marketplaceContractAddress, tokenContractAddress, stakContractAddress } from "../../addresses";
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
  const { contract: megStake } = useContract(stakContractAddress, "stake");
  const { mutateAsync: depositRewardTokens, isLoading } = useContractWrite(megStake, "depositRewardTokens")

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
    rental_duration: string,
    amount: string
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
      // The number of tokens you want to send
      //const amount = price;

      // Add approve + reward
      await megToken?.allowance(fromAddress);
      await depositRewardTokens([ amount ]);

      await megToken?.transfer(toAddress, amount);

      console.log(listing?.asset);

      const res = await axios.post('https://endpointapi/discord', {
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

        <div className={styles.rightListing}>
          <h1>{listing.asset.name}</h1>
          <p>
            Owned by{" "}
            <b>
              {listing.sellerAddress?.slice(0, 6) +
                "..." +
                listing.sellerAddress?.slice(36, 40)}
            </b>
          </p>
          <p>Quantity</p>
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
            <b>{listing.buyoutCurrencyValuePerToken.displayValue}</b>{" "}
            {listing.buyoutCurrencyValuePerToken.symbol}
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 20,
              alignItems: "center",
            }}
          >
            <button
              style={{ borderStyle: "none" }}
              className={styles.mainButton}
              onClick={() => buyNft("1", listing.buyoutCurrencyValuePerToken.displayValue)}

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
