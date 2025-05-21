"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { NextPage } from "next";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { useDeployedContractInfo, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { db } from "~~/services/firebase";

const Fund: NextPage = () => {
  const { address } = useAccount();
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [displayUrls, setDisplayUrls] = useState<{ url: string; owner: string }[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const { data: rpcFunderContractData } = useDeployedContractInfo("RpcFunder");
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
    args: [address, rpcFunderContractData?.address],
  });

  // Load available URLs from Firebase
  useEffect(() => {
    const loadAvailableUrls = async () => {
      try {
        const docRef = doc(db, "urlList", "urlList");
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
          if (address) {
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
    };

    loadAvailableUrls();
  }, [address]);

  const handleCheckboxChange = (testName: string) => {
    setSelectedUrls(prev => (prev.includes(testName) ? prev.filter(test => test !== testName) : [...prev, testName]));
  };

  const handleSubmit = async () => {
    if (!address || typeof window === "undefined") {
      console.log("Submit prevented: No address or not in browser environment");
      return;
    }

    try {
      const docRef = doc(db, "urlList", "urlList");
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

      {/* Header with fixed logo */}
      <header className="container mx-auto md:pb-24 lg:pb-28 border-l border-r border-black md:mt-0">
        <div className="fixed container mt-4 xs:mt-0 md:mt-0 z-10 md:p-6 lg:p-8">
          <Image className="w-40" src="rpc-logo.svg" alt="logo" width={260} height={78} />
        </div>
      </header>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="flex flex-col items-center bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-6 mt-6 w-full max-w-lg">
          <div>
            Your USDC Balance:{""}
            {Number(formatUnits(yourUsdcBalance ?? 0n, 6)).toFixed(6)}
            <span className="font-bold ml-1">{yourTokenSymbol}</span>
          </div>
        </div>
        <div className="flex flex-col items-center bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-6 mt-6 w-full max-w-lg">
          <div className="text-xl">
            Your USDC Allowance Remaining:{" "}
            <div className="inline-flex items-center justify-center">
              {parseFloat(formatUnits(allowance ?? 0n, 6)).toFixed(6)}
              <span className="font-bold ml-1">{yourTokenSymbol}</span>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              className={`btn btn-primary w-full mt-6`}
              onClick={async () => {
                try {
                  await writeUsdcAsync({
                    functionName: "approve",
                    args: [rpcFunderContractData?.address, 1000000n],
                  });
                } catch (err) {
                  console.error("Error calling approve function:", err);
                }
              }}
            >
              Approve 1 USDC For Requests
            </button>
          </div>
        </div>
        <div className="flex flex-col items-center bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-6 mt-6 w-full max-w-lg min-h-[600px] relative">
          <div className="w-full">
            <div className="mb-4">
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
            <button
              className="btn btn-primary w-[300px] mt-6 absolute bottom-6 left-1/2 -translate-x-1/2"
              onClick={handleSubmit}
            >
              Claim URLs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Fund;
