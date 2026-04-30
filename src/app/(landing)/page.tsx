import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center p-8 font-sans selection:bg-blue-500/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[120px]" />
      </div>

      <div className="z-10 w-full max-w-4xl flex flex-col items-center text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Charlie-Lima Aviation
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
            The next generation interactive flow and checklist system for flight simulation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mt-12">
          {/* B738 Card */}
          <Link href="https://b738.charlie-lima.eu" className="group relative p-1 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 hover:from-blue-500 hover:to-purple-500 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity duration-500 blur-xl" />
            <div className="relative h-full flex flex-col items-center p-8 bg-slate-950 rounded-xl transition-all duration-500 group-hover:bg-slate-900/80">
              <div className="w-16 h-16 mb-4 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform duration-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L3 8l6 4.5-3 3-3-1-1.5 1.5 4 2 2 4 1.5-1.5-1-3 3-3 4.5 6l1.2-.7c.4-.2.7-.6.6-1.1z"/></svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">Boeing 737-800</h2>
              <p className="text-sm text-slate-400 text-center">Interactive checklist featuring dynamic briefings, flow paths, and voice support.</p>
            </div>
          </Link>

          {/* A320 Card */}
          <div className="group relative p-1 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 opacity-60 cursor-not-allowed">
            <div className="relative h-full flex flex-col items-center p-8 bg-slate-950 rounded-xl">
              <div className="w-16 h-16 mb-4 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                 <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L3 8l6 4.5-3 3-3-1-1.5 1.5 4 2 2 4 1.5-1.5-1-3 3-3 4.5 6l1.2-.7c.4-.2.7-.6.6-1.1z"/></svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-300 mb-2">Airbus A320</h2>
              <p className="text-sm text-slate-500 text-center">Currently in development. Check back later.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-8 text-xs text-slate-500 tracking-wider">
        VERSION 3.0.0 • NOT FOR REAL WORLD AVIATION
      </div>
    </div>
  );
}
