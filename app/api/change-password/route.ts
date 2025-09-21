import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log("Change password session:", JSON.stringify(session, null, 2));
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const accessToken = session.user.accessToken || session.accessToken;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token not found" },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await request.json();
    console.log("Change password request data:", { currentPassword: "***", newPassword: "***" });

    if (!currentPassword || !newPassword || currentPassword.trim() === "" || newPassword.trim() === "") {
      return NextResponse.json(
        { error: "Current password and new password are required and cannot be empty" },
        { status: 400 }
      );
    }

    // Get API URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://msafiri-visitor-api.onrender.com";
    const baseUrl = apiUrl.endsWith('/api/v1') ? apiUrl.replace('/api/v1', '') : apiUrl;
    
    // API expects confirm_password field
    const requestBody = {
      current_password: currentPassword.trim(),
      new_password: newPassword.trim(),
      confirm_password: newPassword.trim(),
    };
    console.log("API request body:", { ...requestBody, current_password: "***", new_password: "***" });

    const response = await fetch(`${baseUrl}/api/v1/password/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Failed to change password" }));
      console.log("API error response:", JSON.stringify(errorData, null, 2));
      
      // Extract validation error details
      let errorMessage = "Failed to change password";
      if (errorData.detail && Array.isArray(errorData.detail)) {
        const validationErrors = errorData.detail.map(err => `${err.loc?.join('.')} - ${err.msg}`).join(', ');
        errorMessage = `Validation error: ${validationErrors}`;
      } else if (errorData.detail) {
        errorMessage = errorData.detail;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}