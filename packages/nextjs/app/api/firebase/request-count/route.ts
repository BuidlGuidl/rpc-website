import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get("collection");

    if (!collection) {
      return NextResponse.json({ error: "Collection parameter is required" }, { status: 400 });
    }

    const docRef = adminDb.collection(collection).doc("requestCount");
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ totalFundedRequests: 0 }, { status: 200 });
    }

    const data = docSnap.data();
    return NextResponse.json({
      totalFundedRequests: data?.totalFundedRequests || 0,
    });
  } catch (error) {
    console.error("Error fetching request count:", error);
    return NextResponse.json({ error: "Failed to fetch request count" }, { status: 500 });
  }
}
