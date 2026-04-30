"use client";

import { useState } from 'react';

export default function AdminPage() {
  const [dataset, setDataset] = useState<any>(null);
  const [output, setOutput] = useState("");

  const handleGenerate = () => {
    setOutput(JSON.stringify(dataset || { pages: [] }, null, 2));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <select className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2">
            <option value="b738">Boeing 737-800</option>
            <option value="a320">Airbus A320</option>
          </select>
        </header>

        <main className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">Dataset Editor</h2>
          <p className="text-slate-400 mb-6">Modify the JSON structure below and click Generate to copy to your datasets.</p>

          <textarea 
            className="w-full h-96 bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-sm text-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
            value={output}
            readOnly
            placeholder="Generated JSON will appear here..."
          />

          <div className="mt-6 flex gap-4">
            <button 
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              onClick={handleGenerate}
            >
              Generate Dataset
            </button>
            <button 
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
              onClick={() => navigator.clipboard.writeText(output)}
            >
              Copy to Clipboard
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
