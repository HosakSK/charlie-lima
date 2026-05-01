"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Dataset {
  title: string;
  file: string;
}

type ApiData = Record<string, Dataset[]>;

export default function LandingPage() {
  const [aircrafts, setAircrafts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/datasets')
      .then(res => res.json())
      .then((data: ApiData) => {
        setAircrafts(Object.keys(data));
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load aircrafts", err);
        setAircrafts(['b738']); // fallback
        setLoading(false);
      });
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      width: "100vw",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--color-body-bg)",
      fontFamily: "'Inter', sans-serif",
      padding: "20px"
    }}>
      <div style={{
        background: "var(--color-background)",
        padding: "40px",
        borderRadius: "20px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
        maxWidth: "500px",
        width: "100%",
        textAlign: "center",
        border: "1px solid rgba(128,128,128,0.1)",
        backdropFilter: "blur(20px)"
      }}>
        <h1 style={{
          fontSize: "2.5rem",
          fontWeight: 800,
          color: "var(--color-accent)",
          marginBottom: "10px",
          textTransform: "uppercase",
          letterSpacing: "2px"
        }}>Charlie-Lima</h1>
        <p style={{
          fontSize: "1rem",
          color: "var(--color-text)",
          opacity: 0.8,
          marginBottom: "40px"
        }}>Aviation Checklist Engine</p>

        {loading ? (
          <div style={{ color: "var(--color-text)", opacity: 0.5, padding: "20px" }}>Loading fleet...</div>
        ) : (
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px"
          }}>
            {aircrafts.length === 0 && (
              <div style={{ color: "var(--color-text)", opacity: 0.5 }}>No aircraft found.</div>
            )}
            {aircrafts.map(ac => (
              <Link 
                key={ac} 
                href={`/${ac}`}
                style={{
                  display: "block",
                  padding: "18px",
                  background: "rgba(128,128,128,0.05)",
                  border: "2px solid rgba(128,128,128,0.1)",
                  borderRadius: "12px",
                  color: "var(--color-text)",
                  textDecoration: "none",
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  transition: "all 0.2s ease"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-accent)";
                  e.currentTarget.style.boxShadow = "0 5px 15px rgba(0,0,0,0.05)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = "rgba(128,128,128,0.1)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                ✈️ {ac}
              </Link>
            ))}
          </div>
        )}

        <div style={{ marginTop: "40px", fontSize: "0.8rem", color: "var(--color-text)", opacity: 0.5 }}>
          <p>For flight simulation use only.</p>
          <Link href="/creator" style={{ color: "var(--color-accent)", textDecoration: "none", marginTop: "15px", display: "inline-block", fontWeight: "bold" }}>
            ⚙️ Dataset Creator
          </Link>
        </div>
      </div>
    </div>
  );
}
