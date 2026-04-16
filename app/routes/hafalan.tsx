import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/lib/components/ui/button";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function clientLoader() {
  try {
    const response = await fetch(`${BASE_URL}/public/tournament/active`);
    if (!response.ok) return { totalSurah: null };
    const { data } = await response.json();
    return { totalSurah: (data?.total_surah as number) ?? null };
  } catch {
    return { totalSurah: null };
  }
}

const HafalanPage = ({
  loaderData,
}: {
  loaderData: { totalSurah: number | null };
}) => {
  const { totalSurah } = loaderData;
  console.log("Loader data in component:", totalSurah);
  const navigate = useNavigate();

  const [input, setInput] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoll = () => {
    if (!totalSurah) return;

    const excluded = input
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 1 && n <= totalSurah);

    const available = Array.from(
      { length: totalSurah },
      (_, i) => i + 1,
    ).filter((n) => !excluded.includes(n));

    if (available.length === 0) {
      setError(
        "Semua surah sudah dikecualikan. Hapus beberapa nomor dari daftar.",
      );
      return;
    }

    setError(null);
    setLoading(true);
    setResult(null);

    // Rolling animation: cycle through random numbers, then settle on final
    let tick = 0;
    const totalTicks = 18;
    const interval = setInterval(() => {
      const rollingNum =
        available[Math.floor(Math.random() * available.length)];
      setResult(rollingNum);
      tick++;

      if (tick >= totalTicks) {
        clearInterval(interval);
        const final = available[Math.floor(Math.random() * available.length)];
        setResult(final);
        setLoading(false);
      }
    }, 80);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="font-bold text-lg hover:opacity-70 transition-opacity"
          >
            Kambing Cup
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-md mx-auto px-4 sm:px-6 py-10 flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Hafalan</h1>
          {totalSurah !== null && (
            <p className="text-sm text-gray-500 mt-1">Surah 1 – {totalSurah}</p>
          )}
        </div>

        {/* Result display */}
        <div
          className={`w-40 h-40 rounded-2xl shadow-lg flex items-center justify-center bg-white border-2 transition-all duration-150 ${
            loading ? "border-primary scale-105" : "border-gray-200"
          }`}
        >
          {result !== null ? (
            <span
              className={`text-6xl font-extrabold transition-all ${
                loading ? "text-primary opacity-80" : "text-gray-900"
              }`}
            >
              {result}
            </span>
          ) : (
            <span className="text-4xl font-extrabold text-gray-200">?</span>
          )}
        </div>

        {/* Input */}
        <div className="w-full flex flex-col gap-2">
          <label
            htmlFor="excluded"
            className="text-sm font-medium text-gray-700"
          >
            Kecualikan surah (pisahkan dengan koma)
          </label>
          <input
            id="excluded"
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(null);
            }}
            placeholder="Contoh: 1, 2, 4"
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        {/* Roll button */}
        <Button
          onClick={handleRoll}
          disabled={loading || totalSurah === null}
          className="w-full h-12 text-base font-semibold"
        >
          {loading ? "Mengacak..." : "Acak Surah"}
        </Button>

        {totalSurah === null && (
          <p className="text-sm text-gray-400 text-center">
            Tidak ada turnamen aktif saat ini.
          </p>
        )}
      </main>
    </div>
  );
};

export default HafalanPage;
