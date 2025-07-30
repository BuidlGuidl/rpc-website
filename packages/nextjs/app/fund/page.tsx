"use client";

import { useCallback, useEffect, useState } from "react";
import { NextPage } from "next";
import { useInterval } from "usehooks-ts";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { Header } from "~~/components/Header";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const requestsPerUsdc = 200000; // 200,000 requests per 1 USDC

const Fund: NextPage = () => {
  const { address } = useAccount();
  const [searchInput, setSearchInput] = useState("");
  const [displayUrls, setDisplayUrls] = useState<string[]>([]);
  const [urlRequestsRemaining, setUrlRequestsRemaining] = useState<Record<string, number>>({});
  const [urlRequestsTotal, setUrlRequestsTotal] = useState<Record<string, number>>({});

  const firebaseCollection = process.env.NEXT_PUBLIC_FIREBASE_COLLECTION;

  // Add type guard to ensure firebaseCollection is defined
  if (!firebaseCollection) {
    throw new Error("Firebase collection name is not defined in environment variables");
  }

  const { writeContractAsync: writeUsdcAsync } = useScaffoldWriteContract("USDC");

  // Hardcoded bank address
  const bankAddress = "0x8c4f1FB34565650e176d2cd2761B3be10Ca8d35b";

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
    if (count >= 1_000_000) {
      return `${Math.floor(count / 100_000) / 10}M`.replace(".0M", "M");
    } else if (count >= 1_000) {
      return `${Math.floor(count / 100) / 10}k`.replace(".0k", "k");
    }
    return count.toString();
  };

  // Load available URLs from Firebase
  const fetchUserData = useCallback(async () => {
    if (!address) return;

    try {
      const response = await fetch(`/api/firebase/url-list?collection=${firebaseCollection}`);
      if (!response.ok) {
        throw new Error("Failed to fetch URL list");
      }

      const data = await response.json();
      setDisplayUrls(data.urls || []);
      setUrlRequestsRemaining(data.urlRequestsRemaining || {});
      setUrlRequestsTotal(data.urlRequestsTotal || {});
    } catch (e) {
      console.error("Error loading URL list:", e);
      if (e instanceof Error) {
        console.error("Error name:", e.name);
        console.error("Error message:", e.message);
      }
      // Set empty state on error
      setDisplayUrls([]);
      setUrlRequestsRemaining({});
      setUrlRequestsTotal({});
    }
  }, [address, firebaseCollection]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Poll for updates every 10 seconds
  useInterval(fetchUserData, 10000);
  useInterval(refetchUsdcBalance, 10000);

  return (
    <div className="container mx-auto px-0">
      <Header />
      <div className="flex items-center flex-col flex-grow border-black">
        {address && (
          <>
            <div className="flex flex-col items-center bg-base-100 border-x-[1px] border-b-[1px] border-black rounded-none p-6 w-full">
              <span className="font-bold text-lg">💲 Your USDC Balance 💲</span>
              <div className="inline-flex items-center justify-center font-bold text-lg">
                {yourUsdcBalance !== undefined ? Number(formatUnits(yourUsdcBalance, 6)).toFixed(6) : "..."}
                <span className="ml-1">{yourTokenSymbol}</span>
              </div>
            </div>
          </>
        )}
        <div className="flex flex-col items-center bg-base-100 border-x-[1px] border-b-[1px] border-black rounded-none py-6 px-2 xl:px-6 lg:px-6 md:px-6 w-full relative">
          <div className="w-full">
            {!address ? (
              <div className="flex flex-col items-center justify-center h-[400px]">
                <p className="text-xl font-semibold mb-4">Please connect your wallet to view and fund URLs</p>
              </div>
            ) : (
              <>
                <div className="flex justify-center w-full">
                  <span className="font-bold text-lg">Fund URLs</span>
                </div>
                <div className="mb-4 mt-4">
                  <input
                    type="text"
                    placeholder="Search URLs..."
                    className="input input-bordered w-full border-grey rounded-none"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                  />
                </div>
                <div className="space-y-4 border border-base-300 rounded-none p-4">
                  {displayUrls
                    .filter(url => url.toLowerCase().includes(searchInput.toLowerCase()))
                    .sort((a, b) => (urlRequestsTotal[b] || 0) - (urlRequestsTotal[a] || 0))
                    .map(url => (
                      <div
                        key={url}
                        className="flex items-center justify-between pb-4 border-b border-base-300 last:border-b-0 last:pb-0"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="mb-1 break-words overflow-wrap-anywhere">{url}</div>
                          <div className="text-sm text-gray-500">
                            Requests Total:
                            <span className="hidden sm:inline">{(urlRequestsTotal[url] || 0).toLocaleString()}</span>
                            <span className="sm:hidden">{formatRequestsRemaining(urlRequestsTotal[url] || 0)}</span>
                            {" | Remaining Funded:"}
                            <span className="hidden sm:inline">
                              {(urlRequestsRemaining[url] || 0).toLocaleString()}
                            </span>
                            <span className="sm:hidden">{formatRequestsRemaining(urlRequestsRemaining[url] || 0)}</span>
                          </div>
                        </div>
                        <button
                          className="btn btn-primary btn-sm rounded-none ml-4 tooltip tooltip-left tooltip-primary"
                          data-tip="200,000 requests"
                          onClick={async () => {
                            try {
                              const requiredAmount = 1000000n; // 1 USDC (6 decimals)

                              // Check if user has enough USDC balance
                              if (!yourUsdcBalance || yourUsdcBalance < requiredAmount) {
                                notification.error(
                                  "Insufficient USDC balance. Please ensure you have at least 1 USDC in your wallet.",
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

                              const updateResponse = await fetch(
                                `/api/firebase/url-list?collection=${firebaseCollection}`,
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    url,
                                    requestsToAdd,
                                  }),
                                },
                              );

                              if (!updateResponse.ok) {
                                throw new Error("Failed to update URL requests");
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
                          Fund 1 USDC
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
