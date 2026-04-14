import { NextResponse } from 'next/server'

/**
 * Google TWA (Trusted Web Activity) — Digital Asset Links.
 * Bubblewrap yoki Play App Signing dan keyin SHA-256 fingerprintlarni
 * .env da ANDROID_TWA_SHA256_CERT_FINGERPRINTS ga qo‘ying.
 *
 * @see https://developer.android.com/training/app-links/verify-site-associations
 */
export function GET() {
  const packageName = process.env.ANDROID_TWA_PACKAGE_NAME?.trim()
  const raw = process.env.ANDROID_TWA_SHA256_CERT_FINGERPRINTS?.trim()

  if (!packageName || !raw) {
    return NextResponse.json([], {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    })
  }

  const fps = raw
    .split(/[\s,;]+/)
    .map((s) => s.trim().toUpperCase().replace(/:/g, ''))
    .filter((hex) => /^[0-9A-F]{64}$/.test(hex))
    .map((hex) => hex.match(/.{2}/g)!.join(':'))

  if (fps.length === 0) {
    return NextResponse.json([], {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    })
  }

  const body = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: packageName,
        sha256_cert_fingerprints: fps,
      },
    },
  ]

  return NextResponse.json(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
