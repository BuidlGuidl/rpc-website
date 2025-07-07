import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get("collection");

    if (!collection) {
      return NextResponse.json({ error: "Collection parameter is required" }, { status: 400 });
    }

    const docRef = adminDb.collection(collection).doc("urlList");
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({
        urls: [],
        urlRequestsRemaining: {},
        urlRequestsTotal: {},
      });
    }

    const data = docSnap.data();

    // Convert object to array of URLs, filter out timestamp
    const urls = Object.keys(data || {})
      .filter(key => key !== "timestamp")
      .sort((a, b) => a.localeCompare(b));

    // Store requests remaining and total for each URL
    const urlRequestsRemaining: Record<string, number> = {};
    const urlRequestsTotal: Record<string, number> = {};
    Object.entries(data || {}).forEach(([url, urlData]) => {
      if (url !== "timestamp") {
        urlRequestsRemaining[url] = (urlData as any)?.requestsRemaining || 0;
        urlRequestsTotal[url] = (urlData as any)?.requestsTotal || 0;
      }
    });

    return NextResponse.json({
      urls,
      urlRequestsRemaining,
      urlRequestsTotal,
    });
  } catch (error) {
    console.error("Error fetching URL list:", error);
    return NextResponse.json({ error: "Failed to fetch URL list" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get("collection");

    if (!collection) {
      return NextResponse.json({ error: "Collection parameter is required" }, { status: 400 });
    }

    const body = await request.json();
    const { url, requestsToAdd } = body;

    if (!url || typeof requestsToAdd !== "number") {
      return NextResponse.json({ error: "URL and requestsToAdd are required" }, { status: 400 });
    }

    const urlListRef = adminDb.collection(collection).doc("urlList");

    // Get current data
    const urlListSnap = await urlListRef.get();
    const currentData = urlListSnap.exists ? urlListSnap.data() : {};

    // Update the specific URL's requests
    const updatedData = {
      ...currentData,
      [url]: {
        requestsRemaining: ((currentData?.[url] as any)?.requestsRemaining || 0) + requestsToAdd,
      },
      timestamp: Date.now(),
    };

    // Write back to Firestore
    await urlListRef.set(updatedData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating URL list:", error);
    return NextResponse.json({ error: "Failed to update URL list" }, { status: 500 });
  }
}
