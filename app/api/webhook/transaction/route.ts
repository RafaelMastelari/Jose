
import { createClient } from '@supabase/supabase-js'
import { processFinancialTextLogic } from '@/app/lib/financial-processing'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { text, secret } = body

        // 1. Authenticate Request
        if (secret !== process.env.WEBHOOK_SECRET) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        if (!text) {
            return NextResponse.json({ success: false, error: 'Text required' }, { status: 400 })
        }

        // 2. Identify Target User
        const userId = process.env.WEBHOOK_USER_ID
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Webhook user not configured' }, { status: 500 })
        }

        // 3. Create Service Role Client (Bypass RLS)
        // Note: WEBHOOK uses direct supabase-js client with invalidation capability if needed, 
        // but primarily needs to INSERT.
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // 4. Process Helper
        const result = await processFinancialTextLogic(text, userId, supabaseAdmin)

        if (!result.success) {
            return NextResponse.json(result, { status: 400 })
        }

        return NextResponse.json(result)

    } catch (error: any) {
        console.error('Webhook Error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
