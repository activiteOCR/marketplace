import {
  MediaRenderer,
  useNetwork,
  useNetworkMismatch,
  useListing,
  useContract,
} from "@thirdweb-dev/react";
import {
  ChainId,
} from "@thirdweb-dev/sdk";
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

  // Initialize the marketplace contract
  const { contract: marketplace } = useContract(marketplaceContractAddress, "marketplace");

  // Initialize the token contract
  const { contract: megToken } = useContract(tokenContractAddress, "token");

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
    price: string,
    name: any,
    image: any,
    ) {
    try {
      // Ensure user is on the correct network
      if (networkMismatch) {
        switchNetwork && switchNetwork(ChainId.Goerli);
        return;
      }
      console.log(name,image);
      // Address of the wallet you want to send the tokens to
      const toAddress = stakContractAddress;
      // The number of tokens you want to send
      const amount = price;

      await megToken?.transfer(toAddress, amount);
      
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
              onClick={() => buyNft(listing.buyoutCurrencyValuePerToken.displayValue, listing.asset.name, listing.asset.image)}
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
