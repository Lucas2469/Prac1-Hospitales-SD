import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center px-6">
      
      <div className="bg-slate-800 shadow-2xl rounded-2xl p-10 w-full max-w-md text-center space-y-6">
        
        <h1 className="text-4xl font-bold text-cyan-400">
          React + Tailwind 🚀
        </h1>

        <p className="text-slate-400">
          Proyecto listo para escalar como desarrollador serio 😎
        </p>

        <div className="bg-slate-700 p-6 rounded-xl">
          <p className="text-lg mb-4">Contador:</p>

          <p className="text-3xl font-bold text-emerald-400 mb-4">
            {count}
          </p>

          <button
            onClick={() => setCount(count + 1)}
            className="bg-cyan-500 hover:bg-cyan-600 transition-all duration-300 px-6 py-2 rounded-lg font-semibold shadow-lg"
          >
            Incrementar
          </button>
        </div>

        <p className="text-sm text-slate-500">
          Edita el componente y guarda para probar el HMR ⚡
        </p>
      </div>

    </div>
  );
}

export default App;