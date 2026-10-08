import { NextResponse } from 'next/server'

interface CacheEntry {
  success: boolean
  mode: 'streets' | 'fallback'
  coordinates: [number, number][]
  distanceKm: number
  durationMinutes: number
}

const routeCache = new Map<string, CacheEntry>()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const pointsParam = searchParams.get('points')
  if (!pointsParam) {
    return NextResponse.json({ error: 'Missing points parameter' }, { status: 400 })
  }

  const pointPairs = pointsParam.split(';').map((p) => p.split(',').map(Number))
  if (
    pointPairs.length < 2 ||
    pointPairs.some((p) => p.length !== 2 || isNaN(p[0]) || isNaN(p[1]))
  ) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
  }

  const cacheKey = pointsParam
  if (routeCache.has(cacheKey)) {
    return NextResponse.json(routeCache.get(cacheKey))
  }

  try {
    const osrmCoords = pointPairs.map(([lat, lng]) => `${lng},${lat}`).join(';')
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${osrmCoords}?overview=full&geometries=geojson`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    const response = await fetch(osrmUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'CidadeEmOrdem/1.0' },
    })
    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      if (data.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates) {
        const rawCoords: [number, number][] = data.routes[0].geometry.coordinates
        const leafletCoords: [number, number][] = rawCoords.map(([lon, lat]) => [lat, lon])
        const distanceKm = Number(((data.routes[0].distance ?? 0) / 1000).toFixed(1))
        const durationMinutes = Math.round((data.routes[0].duration ?? 0) / 60)

        const result: CacheEntry = {
          success: true,
          mode: 'streets',
          coordinates: leafletCoords,
          distanceKm,
          durationMinutes,
        }
        routeCache.set(cacheKey, result)
        return NextResponse.json(result)
      }
    }
  } catch {
    // Ignore and fallback
  }

  // Fallback to straight line segments
  const fallbackCoords: [number, number][] = pointPairs.map(([lat, lng]) => [lat, lng])
  const fallbackResult: CacheEntry = {
    success: true,
    mode: 'fallback',
    coordinates: fallbackCoords,
    distanceKm: 0,
    durationMinutes: 0,
  }
  return NextResponse.json(fallbackResult)
}
