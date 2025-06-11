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
import { notification } from "~~/utils/scaffold-eth";

const requestsPerUsdc = 200000; // 200,000 requests per 1 USDC

const Fund: NextPage = () => {
  const { address } = useAccount();
  const [searchInput, setSearchInput] = useState("");
  const [displayUrls, setDisplayUrls] = useState<string[]>([]);
  const [requestsFunded, setRequestsFunded] = useState(0);
  const [urlRequestsRemaining, setUrlRequestsRemaining] = useState<Record<string, number>>({});

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

  const { data: yourUsdcBalance, refetch: refetchUsdcBalance } = useScaffoldReadContract({
    contractName: "USDC",
    functionName: "balanceOf",
    args: [address],
    watch: false, // Disable automatic polling
  });

  const formatRequestsRemaining = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`.replace(".0k", "k");
    }
    return count.toString();
  };

  // Load available URLs from Firebase
  const fetchUserData = useCallback(async () => {
    if (!address) return;

    try {
      const docRef = doc(db, firebaseCollection, "urlList");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Convert object to array of URLs, filter out timestamp
        const urls = Object.keys(data)
          .filter(key => key !== "timestamp") // Filter out timestamp
          .sort((a, b) => a.localeCompare(b)); // Sort alphabetically
        setDisplayUrls(urls);

        // Store requests remaining for each URL
        const requestsMap: Record<string, number> = {};
        Object.entries(data).forEach(([url, urlData]) => {
          if (url !== "timestamp") {
            requestsMap[url] = (urlData as any)?.requestsRemaining || 0;
          }
        });
        setUrlRequestsRemaining(requestsMap);

        // Fetch total requests funded
        const userRequestCountRef = doc(db, firebaseCollection, "userRequestCount");
        const userRequestCountSnap = await getDoc(userRequestCountRef);
        if (userRequestCountSnap.exists()) {
          const userData = userRequestCountSnap.data();
          const userCount = userData[address]?.requestsFunded || 0;
          setRequestsFunded(userCount);
        } else {
          console.log("No request count document found in stage collection");
        }
      } else {
        console.log("No URL list found");
        setDisplayUrls([]);
        setUrlRequestsRemaining({});
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
  useInterval(refetchUsdcBalance, 10000);

  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
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
              <span className="font-bold text-lg">💲 Your USDC Balance 💲</span>
              <div className="inline-flex items-center justify-center font-bold text-lg">
                {Number(formatUnits(yourUsdcBalance ?? 0n, 6)).toFixed(6)}
                <span className="ml-1">{yourTokenSymbol}</span>
              </div>
            </div>
            {/* <div className="flex flex-col items-center bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-6 mt-6 w-full max-w-lg">
              <span className="font-bold text-lg">📡 Your Requests Remaining 📡</span>
              <span className="font-bold mt-1 text-2xl">{requestsRemaining.toLocaleString()}</span>
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

                      // Check if user has enough USDC balance
                      if (!yourUsdcBalance || yourUsdcBalance < requiredAmount) {
                        notification.error(
                          "Insufficient USDC balance. Please ensure you have at least 0.1 USDC in your wallet.",
                        );
                        return;
                      }

                      // Proceed with transfer
                      await writeUsdcAsync({
                        functionName: "transfer",
                        args: [bankAddress, requiredAmount],
                      });

                      // Update Firebase with new funded requests count
                      const requestsToAdd = (Number(requiredAmount) * requestsPerUsdc) / 1000000; // Convert USDC to funded requests
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
                  Transfer 0.1 USDC for 20,000 Requests
                </button>
              </div>
            </div> */}
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
                    .filter(url => url.toLowerCase().startsWith(searchInput.toLowerCase()))
                    .map(url => (
                      <div key={url} className="flex items-center justify-between">
                        <div className="flex-1">
                          <span>{url}</span>
                          <span className="ml-2 text-sm text-gray-500">
                            [Requests Remaining: {formatRequestsRemaining(urlRequestsRemaining[url] || 0)}]
                          </span>
                        </div>
                        <button
                          className="btn btn-primary btn-sm ml-4"
                          onClick={async () => {
                            try {
                              if (!bankContractData?.address) {
                                throw new Error("Bank contract address not found");
                              }

                              const requiredAmount = 100000n; // 0.1 USDC (6 decimals)
                              const bankAddress = bankContractData.address;

                              // Check if user has enough USDC balance
                              if (!yourUsdcBalance || yourUsdcBalance < requiredAmount) {
                                notification.error(
                                  "Insufficient USDC balance. Please ensure you have at least 0.1 USDC in your wallet.",
                                );
                                return;
                              }

                              // Proceed with transfer
                              await writeUsdcAsync({
                                functionName: "transfer",
                                args: [bankAddress, requiredAmount],
                              });

                              // Update Firebase with new funded requests count for this specific URL
                              const requestsToAdd = (Number(requiredAmount) * requestsPerUsdc) / 1000000; // Convert USDC to funded requests
                              const urlListRef = doc(db, firebaseCollection, "urlList");
                              const urlListSnap = await getDoc(urlListRef);

                              if (urlListSnap.exists()) {
                                const urlData = urlListSnap.data();
                                const currentRequestsRemaining = urlData[url]?.requestsRemaining || 0;
                                await setDoc(
                                  urlListRef,
                                  {
                                    [url]: {
                                      ...urlData[url],
                                      requestsRemaining: currentRequestsRemaining + requestsToAdd,
                                    },
                                  },
                                  { merge: true },
                                );
                              }

                              // Update the local state to reflect the new total
                              setUrlRequestsRemaining(prev => ({
                                ...prev,
                                [url]: prev[url] + requestsToAdd,
                              }));
                            } catch (err) {
                              console.error("Error in fund transfer:", err);
                              if (err instanceof Error) {
                                notification.error(err.message);
                              }
                            }
                          }}
                        >
                          Fund 0.1 USDC
                        </button>
                      </div>
                    ))}
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
