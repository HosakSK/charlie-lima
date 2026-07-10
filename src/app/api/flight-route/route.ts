import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from')?.toUpperCase();
  const to = searchParams.get('to')?.toUpperCase();

  if (!from || !to) {
    return NextResponse.json({ error: 'from and to are required' }, { status: 400 });
  }

  try {
    // 1. Search for plans
    const searchUrl = `https://api.flightplandatabase.com/search/plans?fromICAO=${from}&toICAO=${to}`;
    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Charlie-Lima-Flight-Finder' },
      next: { revalidate: 86400 } // Cache searches for 1 day
    });

    if (!searchRes.ok) {
      throw new Error(`FPD search failed: ${searchRes.status}`);
    }

    const plans = await searchRes.json();
    if (!Array.isArray(plans) || plans.length === 0) {
      return NextResponse.json({ route: 'DCT', distance: null, waypoints: [] });
    }

    // 2. Fetch the first plan details
    const planId = plans[0].id;
    const planUrl = `https://api.flightplandatabase.com/plan/${planId}`;
    const planRes = await fetch(planUrl, {
      headers: { 'User-Agent': 'Charlie-Lima-Flight-Finder' },
      next: { revalidate: 86400 }
    });

    if (!planRes.ok) {
      throw new Error(`FPD plan fetch failed: ${planRes.status}`);
    }

    const planData = await planRes.json();
    const nodes = planData.route?.nodes || [];
    const waypoints = nodes.map((node: any) => ({
      ident: node.ident,
      type: node.type,
      lat: node.lat,
      lon: node.lon
    }));

    let routeString = planData.routeString || '';
    if (!routeString && nodes.length > 0) {
      routeString = nodes.map((node: any) => node.ident).join(' ');
    }

    // Clean up routeString to remove departure and arrival if they are at the ends
    const words = routeString.split(' ');
    if (words[0] === from) words.shift();
    if (words[words.length - 1] === to) words.pop();
    const routeClean = words.join(' ');

    return NextResponse.json({
      route: routeClean || 'DCT',
      distance: planData.distance,
      waypoints: waypoints
    });
  } catch (error: any) {
    console.error('Flight Route API Error:', error);
    // Safe fallback to DCT
    return NextResponse.json({ route: 'DCT', distance: null, waypoints: [] });
  }
}
