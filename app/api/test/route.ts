import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "API is working correctly",
    timestamp: new Date().toISOString(),
  })
}

export async function POST() {
  return NextResponse.json({
    success: true,
    message: "POST request received successfully",
    timestamp: new Date().toISOString(),
  })
}
