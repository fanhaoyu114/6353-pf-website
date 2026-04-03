import { NextResponse } from 'next/server'

// GET /api/messages — returns empty array on Vercel
// The message board mini-service is not deployed on Vercel (requires persistent WebSocket server).
// On production, the frontend gracefully shows "OFFLINE" status.
export async function GET() {
  return NextResponse.json([])
}
