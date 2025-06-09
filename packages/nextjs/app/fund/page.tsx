"use client";

import { useCallback, useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { NextPage } from "next";
import { useInterval } from "usehooks-ts";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { Header } from "~~/components/Header";
import { useDeployedContractInfo, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { db } from "~~/services/firebase";

const Fund: NextPage = () => {
  const { address } = useAccount();
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [displayUrls, setDisplayUrls] = useState<{ url: string; owner: string }[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [requestsFunded, setRequestsFunded] = useState(0);
  const [requestsRemaining, setRequestsRemaining] = useState(0);

  const firebaseCollection = process.env.NEXT_PUBLIC_FIREBASE_COLLECTION;

  // Add type guard to ensure firebaseCollection is defined
  if (!firebaseCollection) {
    throw new Error("Firebase collection name is not defined in environment variables");
  }

  const { data: bankContractData } = useDeployedContractInfo("Bank");
  const { writeContractAsync: writeUsdcAsync } = useScaffoldWriteContract("USDC");

  // Reduce polling frequency for contract reads
  const { data: yourTokenSymbol } = useScaffoldReadContract({
    contractName: "USDC",
    functionName: "symbol",
    watch: false, // Disable automatic polling
  });

  const { data: yourUsdcBalance } = useScaffoldReadContract({
    contractName: "USDC",
    functionName: "balanceOf",
    args: [address],
    watch: false, // Disable automatic polling
  });

  const { data: allowance } = useScaffoldReadContract({
    contractName: "USDC",
    functionName: "allowance",
    args: [address, bankContractData?.address],
  });

  // Load available URLs from Firebase
  const fetchUserData = useCallback(async () => {
    if (!address) return;

    try {
      const docRef = doc(db, firebaseCollection, "urlList");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Convert object to array of {url, owner} objects, filter out timestamp and claimed URLs
        const urlsWithOwners = Object.entries(data)
          .filter(([key]) => key !== "timestamp") // Filter out timestamp
          .map(([url, urlData]) => ({
            url,
            owner: (urlData as { owner: string }).owner,
          }))
          .filter(item => !item.owner || String(item.owner).toLowerCase() === String(address)?.toLowerCase()) // Only show unclaimed or user's URLs
          .sort((a, b) => a.url.localeCompare(b.url)); // Sort alphabetically
        setDisplayUrls(urlsWithOwners);

        // Set selected URLs based on owner
        const userSelectedUrls = urlsWithOwners
          .filter(item => String(item.owner).toLowerCase() === String(address).toLowerCase())
          .map(item => item.url);
        setSelectedUrls(userSelectedUrls);

        // Sort URLs with selected ones at the top
        const sortedUrls = [...urlsWithOwners].sort((a, b) => {
          const aSelected = userSelectedUrls.includes(a.url);
          const bSelected = userSelectedUrls.includes(b.url);
          if (aSelected && !bSelected) return -1;
          if (!aSelected && bSelected) return 1;
          return a.url.localeCompare(b.url);
        });
        setDisplayUrls(sortedUrls);

        // Fetch total requests funded and remaining
        const userRequestCountRef = doc(db, firebaseCollection, "userRequestCount");
        const userRequestCountSnap = await getDoc(userRequestCountRef);
        if (userRequestCountSnap.exists()) {
          const userData = userRequestCountSnap.data();
          const userCount = userData[address]?.requestsFunded || 0;
          const remainingCount = userData[address]?.requestsRemaining || 0;
          setRequestsFunded(userCount);
          setRequestsRemaining(remainingCount);
        } else {
          console.log("No request count document found in stage collection");
        }
      } else {
        console.log("No URL list found");
        setSelectedUrls([]);
        setDisplayUrls([]);
      }
    } catch (e) {
      console.error("Error loading URL list:", e);
      if (e instanceof Error) {
        console.error("Error name:", e.name);
        console.error("Error message:", e.message);
      }
    }
  }, [address, firebaseCollection]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Poll for updates every 10 seconds
  useInterval(fetchUserData, 10000);

  const handleCheckboxChange = (testName: string) => {
    setSelectedUrls(prev => (prev.includes(testName) ? prev.filter(test => test !== testName) : [...prev, testName]));
  };

  const handleSubmit = async () => {
    if (!address || typeof window === "undefined") {
      console.log("Submit prevented: No address or not in browser environment");
      return;
    }

    try {
      const docRef = doc(db, firebaseCollection, "urlList");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const newData = { ...data };

        // Update selected URLs
        selectedUrls.forEach(url => {
          newData[url] = { owner: address };
        });

        // Reset unselected URLs that were previously owned by this user
        Object.entries(data).forEach(([url, urlData]) => {
          const urlInfo = urlData as { owner: string };
          if (urlInfo.owner === address && !selectedUrls.includes(url)) {
            newData[url] = { owner: "" };
          }
        });

        // Update the entire document with the new data
        await setDoc(docRef, newData, { merge: true });
        console.log("Successfully updated URL owners in Firebase");

        // Show success message
        const claimedCount = selectedUrls.length;
        const unclaimedCount = Object.entries(data).filter(([url, urlData]) => {
          const urlInfo = urlData as { owner: string };
          return urlInfo.owner === address && !selectedUrls.includes(url);
        }).length;

        let message = "";
        if (claimedCount > 0 && unclaimedCount > 0) {
          message = `Successfully claimed ${claimedCount} URL${claimedCount > 1 ? "s" : ""} and unclaimed ${unclaimedCount} URL${unclaimedCount > 1 ? "s" : ""}`;
        } else if (claimedCount > 0) {
          message = `Successfully claimed ${claimedCount} URL${claimedCount > 1 ? "s" : ""}`;
        } else if (unclaimedCount > 0) {
          message = `Successfully unclaimed ${unclaimedCount} URL${unclaimedCount > 1 ? "s" : ""}`;
        }

        setSuccessMessage(message);
        setShowSuccessModal(true);

        // Proceed with transfer
        if (!bankContractData?.address) {
          throw new Error("Bank contract address not found");
        }
        await writeUsdcAsync({
          functionName: "transfer",
          args: [bankContractData.address, 100000n],
        });

        // Update Firebase with new funded requests count
        const requestsToAdd = (Number(100000n) * 200000) / 1000000; // Convert USDC to funded requests (1 USDC = 200,000 requests)
        const userRequestCountRef = doc(db, firebaseCollection, "userRequestCount");
        const userRequestCountSnap = await getDoc(userRequestCountRef);

        if (userRequestCountSnap.exists()) {
          const userData = userRequestCountSnap.data();
          const currentRequestsFunded = userData[address]?.requestsFunded || 0;
          await setDoc(
            userRequestCountRef,
            {
              [address]: {
                ...userData[address],
                requestsFunded: currentRequestsFunded + requestsToAdd,
              },
            },
            { merge: true },
          );
        } else {
          // If document doesn't exist, create it with initial count
          await setDoc(userRequestCountRef, {
            [address]: {
              requestsFunded: requestsToAdd,
            },
          });
        }

        // Update the local state to reflect the new total
        setRequestsFunded(prev => prev + requestsToAdd);
      }
    } catch (e) {
      console.error("Error updating URL owners:", e);
      if (e instanceof Error) {
        console.error("Error name:", e.name);
        console.error("Error message:", e.message);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-base-100 p-6 rounded-xl shadow-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Success</h3>
            <p className="mb-6">{successMessage}</p>
            <button className="btn btn-primary w-full" onClick={() => setShowSuccessModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      <Header />
      <div className="flex items-center flex-col flex-grow pt-10 lg:border-t-[1px] border-black">
        {address && (
          <>
            <div className="flex flex-col items-center bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-6 mt-0 w-full max-w-lg">
              <div className="flex flex-col items-center">
                <span className="font-bold text-lg">🎉 Total Requests Funded 🎉</span>
                <span className="font-bold mt-1 text-2xl">{requestsFunded.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex flex-col items-center bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-6 mt-6 w-full max-w-lg">
              <div className="inline-flex items-center justify-center">
                Your USDC Balance: {Number(formatUnits(yourUsdcBalance ?? 0n, 6)).toFixed(6)}
                <span className="ml-1">{yourTokenSymbol}</span>
              </div>
            </div>
            <div className="flex flex-col items-center bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-6 mt-6 w-full max-w-lg">
              <span className="font-bold text-lg">💲 Your USDC Allowance Remaining 💲</span>
              <span className="font-bold mt-1 text-2xl">{requestsRemaining.toLocaleString()}</span>
              <span className="text-xl mt-2">
                {parseFloat(formatUnits(allowance ?? 0n, 6)).toFixed(6)}
                <span className="ml-1">{yourTokenSymbol}</span>
              </span>
              <span className="text-l">
                ({Math.floor(parseFloat(formatUnits(allowance ?? 0n, 6)) * 1000000).toLocaleString()} requests)
              </span>
              <div className="flex gap-4">
                <button
                  className={`btn btn-primary w-full mt-6`}
                  onClick={async () => {
                    try {
                      if (!bankContractData?.address) {
                        throw new Error("Bank contract address not found");
                      }

                      const requiredAmount = 100000n; // 0.1 USDC (6 decimals)
                      const bankAddress = bankContractData.address; // Store address to satisfy TypeScript

                      // Check if we need to approve first
                      if (!allowance || allowance < requiredAmount) {
                        // Only approve if we don't have enough allowance
                        await writeUsdcAsync({
                          functionName: "approve",
                          args: [bankAddress, requiredAmount],
                        });
                      }

                      // Proceed with transfer
                      await writeUsdcAsync({
                        functionName: "transfer",
                        args: [bankAddress, requiredAmount],
                      });

                      // Update Firebase with new funded requests count
                      const requestsToAdd = (Number(requiredAmount) * 200000) / 1000000; // Convert USDC to funded requests (1 USDC = 200,000 requests)
                      const userRequestCountRef = doc(db, firebaseCollection, "userRequestCount");
                      const userRequestCountSnap = await getDoc(userRequestCountRef);

                      if (userRequestCountSnap.exists()) {
                        const userData = userRequestCountSnap.data();
                        const currentRequestsRemaining = userData[address]?.requestsRemaining || 0;
                        await setDoc(
                          userRequestCountRef,
                          {
                            [address]: {
                              ...userData[address],
                              requestsRemaining: currentRequestsRemaining + requestsToAdd,
                            },
                          },
                          { merge: true },
                        );
                      } else {
                        // If document doesn't exist, create it with initial count
                        await setDoc(userRequestCountRef, {
                          [address]: {
                            requestsRemaining: requestsToAdd,
                          },
                        });
                      }

                      // Update the local state to reflect the new total
                      setRequestsRemaining(prev => prev + requestsToAdd);
                    } catch (err) {
                      console.error("Error in approve/transfer sequence:", err);
                    }
                  }}
                >
                  {!allowance || allowance < 100000n ? "Approve & Transfer 0.1 USDC" : "Transfer 0.1 USDC"}
                </button>
              </div>
            </div>
          </>
        )}
        <div className="flex flex-col items-center bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-6 mt-6 w-full max-w-lg min-h-[640px] relative">
          <div className="w-full">
            {!address ? (
              <div className="flex flex-col items-center justify-center h-[400px]">
                <p className="text-xl font-semibold mb-4">Please connect your wallet to view and claim URLs</p>
              </div>
            ) : (
              <>
                <div className="flex justify-center w-full">
                  <span className="font-bold text-lg">Claim URLs</span>
                </div>
                <div className="mb-4 mt-4">
                  <input
                    type="text"
                    placeholder="Search URLs..."
                    className="input input-bordered w-full"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                  />
                </div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {displayUrls
                    .filter(({ url }) => url.toLowerCase().startsWith(searchInput.toLowerCase()))
                    .map(({ url }) => (
                      <div key={url} className="flex items-center">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary"
                          checked={selectedUrls.includes(url)}
                          onChange={() => handleCheckboxChange(url)}
                        />
                        <span className="ml-2">{url}</span>
                      </div>
                    ))}
                </div>
                <div className="w-full flex justify-center">
                  <button className="btn btn-primary w-[300px] mt-6 absolute bottom-6" onClick={handleSubmit}>
                    Change URL Selection
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Fund;
