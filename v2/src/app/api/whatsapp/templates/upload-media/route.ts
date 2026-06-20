import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin-client'

const MAX_SIZES: Record<string, number> = {
  image: 1 * 1024 * 1024,
  video: 16 * 1024 * 1024,
  document: 5 * 1024 * 1024,
}

const ALLOWED_MIME = new Set([
  'image/png', 'image/jpeg', 'image/webp',
  'video/mp4', 'video/3gpp',
  'application/pdf',
])

const MIME_TO_EXT: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'video/3gpp': '.3gp',
  'application/pdf': '.pdf',
}

function mediaType(mime: string): string {
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  return 'document'
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const headerType = (formData.get('headerType') as string) || 'image'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Allowed: JPEG, PNG, WebP, MP4, 3GP, PDF` },
        { status: 400 }
      )
    }

    const mType = mediaType(file.type)
    const expectedType = headerType === 'document' ? 'document' : headerType === 'video' ? 'video' : 'image'
    if (mType !== expectedType) {
      return NextResponse.json(
        { error: `File is a ${mType} but header type expects ${expectedType}` },
        { status: 400 }
      )
    }

    const maxSize = MAX_SIZES[mType]
    if (file.size > maxSize) {
      const mb = (maxSize / (1024 * 1024)).toFixed(0)
      return NextResponse.json(
        { error: `File too large. Max ${mb}MB for ${mType} files.` },
        { status: 400 }
      )
    }

    const ext = MIME_TO_EXT[file.type] || ''
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 50)
    const filePath = `${user.id}/${timestamp}-${safeName}${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabaseAdmin()
      .storage
      .from('template-media')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('[upload-media] Upload error:', uploadError.message)
      return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
    }

    const { data: urlData } = supabaseAdmin()
      .storage
      .from('template-media')
      .getPublicUrl(filePath)

    return NextResponse.json({
      url: urlData.publicUrl,
      path: filePath,
      mediaType: mType,
    })
  } catch (err: any) {
    console.error('[upload-media] Error:', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
