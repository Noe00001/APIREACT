import React, { useState } from 'react';
import { getAiRecommendation } from '../../services/api';
import { Bot, Coffee, Zap, Smile, Cookie, PawPrint, Sparkles, AlertTriangle, Cpu, UtensilsCrossed } from 'lucide-react';

const AiCoffeeRecommender = () => {
  const [estadoAnimo, setEstadoAnimo] = useState('Productivo y enfocado');
  const [preferenciaSabor, setPreferenciaSabor] = useState('balanceado');
  const [gustaGatos, setGustaGatos] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  const estadosPredefinidos = [
    { id: 'Productivo y enfocado', label: 'Productivo y enfocado', icon: Coffee },
    { id: 'Cansado, necesito energía urgente', label: 'Cansado, necesito energía urgente', icon: Zap },
    { id: 'Tranquilo y buscando relax', label: 'Tranquilo y buscando relax', icon: Smile },
    { id: 'Antojado de algo dulce', label: 'Antojado de algo dulce', icon: Cookie },
    { id: 'En busca de mimos felinos', label: 'En busca de mimos felinos', icon: PawPrint },
  ];

  const handleConsultar = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResultado(null);

    try {
      const data = await getAiRecommendation({
        estado_animo: estadoAnimo,
        preferencia_sabor: preferenciaSabor,
        gusta_gatos: gustaGatos,
      });
      setResultado(data);
    } catch (err) {
      setError(err.message || 'No fue posible obtener la recomendación con IA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-200 my-8">
      <div className="flex items-center space-x-3 mb-4">
        <Bot size={36} className="text-amber-800" />
        <div>
          <h2 className="text-2xl font-bold text-amber-950 font-serif">
            Sommelier de Café & Cat Matchmaker con IA
          </h2>
          <p className="text-sm text-amber-800">
            Descubre tu bebida ideal, postre perfecto y gatito compañero según tu momento del día.
          </p>
        </div>
      </div>

      <form onSubmit={handleConsultar} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-amber-900 mb-1">
            ¿Cómo te sientes o qué necesitas hoy?
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {estadosPredefinidos.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setEstadoAnimo(id)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all inline-flex items-center gap-1.5 ${
                  estadoAnimo === id
                    ? 'bg-amber-700 text-white border-amber-700 shadow-sm'
                    : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100'
                }`}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <input
            type="text"
            value={estadoAnimo}
            onChange={(e) => setEstadoAnimo(e.target.value)}
            placeholder="O escribe tu estado de ánimo personalizado..."
            required
            className="w-full px-4 py-2.5 rounded-xl border border-amber-300 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white text-slate-800 text-sm shadow-inner"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-amber-900 mb-1">
              Perfil de sabor preferido:
            </label>
            <select
              value={preferenciaSabor}
              onChange={(e) => setPreferenciaSabor(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-amber-300 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white text-slate-800 text-sm shadow-sm"
            >
              <option value="balanceado">Equilibrado / Tradicional</option>
              <option value="intenso">Fuerte & Amargo (High Caffeine)</option>
              <option value="dulce">Dulce & Acaramelado</option>
              <option value="suave">Suave & Cremoso con Leche</option>
              <option value="cítrico">Cítrico & Frutal</option>
            </select>
          </div>

          <div className="flex items-center pt-6">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={gustaGatos}
                onChange={(e) => setGustaGatos(e.target.checked)}
                className="w-5 h-5 text-amber-600 rounded border-amber-300 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-sm font-semibold text-amber-950 inline-flex items-center gap-1.5">
                <PawPrint size={16} /> Recomendarme un gatito para consentir
              </span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-6 py-3 bg-amber-800 hover:bg-amber-900 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>El Sommelier de IA está pensando...</span>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-2"><Sparkles size={18} /> Obtener Recomendación Inteligente</span>
            </>
          )}
        </button>
      </form>

      {/* Manejo de estados de error */}
      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center space-x-2">
          <AlertTriangle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Resultado generado por la IA */}
      {resultado && (
        <div className="mt-6 bg-white rounded-2xl p-6 border border-amber-200 shadow-md animate-fade-in space-y-4">
          <div className="border-b border-amber-100 pb-3 flex flex-wrap justify-between items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
              <Cpu size={14} /> Motor: {resultado.modelo_ia_utilizado}
            </span>
            <span className="text-xs text-amber-700">Café Cato Artificial Intelligence</span>
          </div>

          <p className="text-amber-950 text-base italic leading-relaxed">
            "{resultado.mensaje_sommelier}"
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <span className="text-xs uppercase tracking-wider text-amber-700 font-bold flex items-center gap-1.5 mb-1">
                <Coffee size={14} /> Café Recomendado
              </span>
              <span className="text-base font-bold text-amber-950">
                {resultado.cafe_recomendado}
              </span>
            </div>

            <div className="p-3 bg-orange-50 rounded-xl border border-orange-200">
              <span className="text-xs uppercase tracking-wider text-orange-700 font-bold flex items-center gap-1.5 mb-1">
                <UtensilsCrossed size={14} /> Maridaje Sugerido
              </span>
              <span className="text-base font-bold text-orange-950">
                {resultado.maridaje_sugerido}
              </span>
            </div>

            {resultado.gato_companero && (
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                <span className="text-xs uppercase tracking-wider text-rose-700 font-bold flex items-center gap-1.5 mb-1">
                  <PawPrint size={14} /> Tu Compañero Felino
                </span>
                <span className="text-base font-bold text-rose-950">
                  {resultado.gato_companero}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AiCoffeeRecommender;
