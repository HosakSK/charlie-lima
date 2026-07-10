import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from')?.toUpperCase();
  const to = searchParams.get('to')?.toUpperCase();

  if (!from || !to) {
    return NextResponse.json({ error: 'from and to are required' }, { status: 400 });
  }

  try {
    // 1. Search for plans, sorted by popularity descending
    const searchUrl = `https://api.flightplandatabase.com/search/plans?fromICAO=${from}&toICAO=${to}&limit=10`;
    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Charlie-Lima-Flight-Finder/3.0' },
      next: { revalidate: 86400 } // Cache for 1 day
    });

    if (!searchRes.ok) {
      throw new Error(`FPD search failed: ${searchRes.status}`);
    }

    const plans: any[] = await searchRes.json();
    if (!Array.isArray(plans) || plans.length === 0) {
      return NextResponse.json({ 
        route: 'DCT', 
        distance: null, 
        waypoints: [],
        source: null
      });
    }

    // 2. Sort by popularity descending, pick most popular
    plans.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
    const bestPlan = plans[0];

    // 3. Fetch full plan details
    const planRes = await fetch(`https://api.flightplandatabase.com/plan/${bestPlan.id}`, {
      headers: { 'User-Agent': 'Charlie-Lima-Flight-Finder/3.0' },
      next: { revalidate: 86400 }
    });

    if (!planRes.ok) {
      throw new Error(`FPD plan fetch failed: ${planRes.status}`);
    }

    const planData = await planRes.json();
    const nodes: any[] = planData.route?.nodes || [];

    const waypoints = nodes.map((node: any) => ({
      ident: node.ident,
      type: node.type,
      lat: node.lat,
      lon: node.lon,
      alt: node.alt,
      via: node.via?.ident ?? null,
      viaType: node.via?.type ?? null,
    }));

    // Build route string from nodes, excluding DEP/ARR airports
    const innerNodes = nodes.filter(n => n.type !== 'APT');
    let routeString = planData.routeString || '';
    if (!routeString && innerNodes.length > 0) {
      // Build with airways: "FIX AWY FIX ..."
      const parts: string[] = [];
      for (const node of innerNodes) {
        if (node.via) parts.push(node.via.ident);
        parts.push(node.ident);
      }
      // Deduplicate consecutive duplicates
      routeString = parts.filter((v, i, a) => i === 0 || v !== a[i - 1]).join(' ');
    }

    // Clean up routeString to remove departure and arrival if they are at the ends
    const words = routeString.trim().split(/\s+/);
    if (words[0] === from) words.shift();
    if (words[words.length - 1] === to) words.pop();
    const routeClean = words.join(' ');

    // Extract cruise altitude from notes
    const notes: string = planData.notes || '';
    const altMatch = notes.match(/Cruise Altitude:\s*(\d+)ft/);
    const cruiseAlt = altMatch ? parseInt(altMatch[1]) : (bestPlan.maxAltitude ?? null);

    // Build airways summary (unique airways used)
    const airways = [...new Set(
      nodes
        .filter(n => n.via?.type?.startsWith('AWY'))
        .map(n => n.via.ident)
    )].slice(0, 6);

    return NextResponse.json({
      route: routeClean || 'DCT',
      distance: Math.round(planData.distance ?? bestPlan.distance ?? 0),
      waypoints,
      cruiseAltitude: cruiseAlt,
      waypointCount: innerNodes.length,
      airways,
      source: {
        name: 'Flight Plan Database',
        url: `https://flightplandatabase.com/plan/${bestPlan.id}`,
        popularity: bestPlan.popularity ?? 0,
        cycle: planData.cycle?.ident ?? null,
        username: planData.user?.username ?? null,
      }
    });

  } catch (error: any) {
    console.error('Flight Route API Error:', error);
    return NextResponse.json({ 
      route: 'DCT', 
      distance: null, 
      waypoints: [],
      source: null,
      error: error.message || String(error)
    });
  }
}
