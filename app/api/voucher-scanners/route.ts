import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenant_id");
    const createdBy = searchParams.get("created_by");

    if (!tenantId || !createdBy) {
      return NextResponse.json(
        { error: "Missing tenant_id or created_by parameter" },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const response = await fetch(
      `${API_BASE_URL}/api/v1/voucher-scanners?tenant_id=${tenantId}&created_by=${encodeURIComponent(createdBy)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating voucher scanner:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenant_id");
    const eventId = searchParams.get("event_id");

    if (!tenantId) {
      return NextResponse.json(
        { error: "Missing tenant_id parameter" },
        { status: 400 }
      );
    }

    let url = `${API_BASE_URL}/api/v1/voucher-scanners?tenant_id=${tenantId}`;
    if (eventId) {
      url += `&event_id=${eventId}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: authHeader,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching voucher scanners:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}