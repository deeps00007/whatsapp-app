import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMediaUrl, downloadMedia } from '@/lib/whatsapp/meta-api'
import { decrypt } from '@/lib/whatsapp/encryption'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    const { mediaId } = await params

    if (!mediaId) {
      return NextResponse.json(
        { error: 'Media ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: config, error: configError } = await supabase
      .from('whatsapp_config')
      .select('access_token')
      .eq('user_id', user.id)
      .single()

    if (configError || !config) {
      return NextResponse.json(
        { error: 'WhatsApp not configured' },
        { status: 400 }
      )
    }

    const { data: msg } = await supabase
      .from('messages')
      .select('id')
      .like('media_url', `%/${mediaId}%`)
      .limit(1)
      .maybeSingle()

    if (!msg) {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404 }
      )
    }

    const accessToken = decrypt(config.access_token)

    const mediaInfo = await getMediaUrl({ mediaId, accessToken })

    const { buffer, contentType } = await downloadMedia({
      downloadUrl: mediaInfo.url,
      accessToken,
    })

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType || mediaInfo.mimeType || 'application/octet-stream',
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error('Error in WhatsApp media GET:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    )
  }
}
