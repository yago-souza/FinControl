import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { CreditCard, CalendarDays, TrendingUp, Wallet, AlertCircle } from "lucide-react";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#F4A460", "#DDA0DD"];

export default function Dashboard() {
  const [resumo, setResumo] = useState(null);
  const [mesAno, setMesAno] = useState(() => {
    const data = new Date();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    return `${mes}/${data.getFullYear()}`;
  });

  useEffect(() => {
    fetchResumo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesAno]);

  const fetchResumo = async () => {
    try {
      const response = await axios.get(`/api/dashboard/resumo?mes=${encodeURIComponent(mesAno)}`);
      console.log("Response:", response);
      setResumo(response.data);
    } catch (error) {
      console.error("Erro ao buscar resumo:", error);
    }
  };

  const generateMonthOptions = () => {
    const options = [];
    const today = new Date();
    for (let i = -12; i <= 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const mesVal = String(d.getMonth() + 1).padStart(2, "0");
      const anoVal = d.getFullYear();
      const value = `${mesVal}/${anoVal}`;
      const mesNome = d.toLocaleString("pt-BR", { month: "short" }).replace(".", "");
      const label = `${mesNome.charAt(0).toUpperCase() + mesNome.slice(1)} de ${anoVal}`;
      options.push({ value, label });
    }
    return options;
  };

  if (!resumo) return <div className="p-6">Carregando dashboard...</div>;

  const dadosGraficoCategoria = Object.entries(resumo.gastosPorCategoria || {}).map(([name, value]) => ({
    name,
    value
  }));

  const getVencimentoStatus = (vencimento) => {
    if (vencimento.pago) {
      return { label: "Pago", colorClass: "bg-green-50 text-green-700 border-green-200" };
    }
    
    // Parse mesAno to get year and month of the dashboard (format "MM/YYYY")
    if (!mesAno) return { label: "Pendente", colorClass: "bg-yellow-50 text-yellow-700 border-yellow-200" };
    const [mes, ano] = mesAno.split("/").map(Number);
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    
    const dashboardPeriod = ano * 100 + mes;
    const currentPeriod = currentYear * 100 + currentMonth;
    
    if (dashboardPeriod < currentPeriod) {
      return { label: "Atrasado", colorClass: "bg-red-50 text-red-700 border-red-200" };
    } else if (dashboardPeriod > currentPeriod) {
      return { label: "Pendente", colorClass: "bg-yellow-50 text-yellow-700 border-yellow-200" };
    } else {
      if (currentDay > vencimento.dia) {
        return { label: "Atrasado", colorClass: "bg-red-50 text-red-700 border-red-200" };
      } else {
        return { label: "Pendente", colorClass: "bg-yellow-50 text-yellow-700 border-yellow-200" };
      }
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Mês/Ano:</label>
          <select 
            value={mesAno} 
            onChange={(e) => setMesAno(e.target.value)} 
            className="border rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm font-medium text-gray-700"
          >
            {generateMonthOptions().map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><CreditCard size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Gastos no Cartão</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(resumo.totalCartao)}</h3>
            <p className="text-xs text-gray-400 mt-1">
              À vista: {formatCurrency(resumo.totalAVista)} | Parc: {formatCurrency(resumo.totalParcelado)}
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><CalendarDays size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Gastos Fixos</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(resumo.totalFixo)}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg"><TrendingUp size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Investido</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(resumo.totalInvestido)}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Wallet size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Geral (Saída)</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(resumo.totalCartao + resumo.totalFixo)}</h3>
          </div>
        </div>
      </div>

      {/* Sub-row for PIX Debts/Receivables Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-rose-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">A Pagar no Mês (PIX)</p>
            <h4 className="text-xl font-bold text-rose-600">{formatCurrency(resumo.totalAPagarMes)}</h4>
          </div>
          <span className="text-xs text-rose-500 bg-rose-50 px-2 py-1 rounded-md font-bold">Débitos PIX</span>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">A Receber no Mês (PIX)</p>
            <h4 className="text-xl font-bold text-emerald-600">{formatCurrency(resumo.totalAReceberMes)}</h4>
          </div>
          <span className="text-xs text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md font-bold">Créditos PIX</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Gastos por Categoria (Unificado)</h3>
          {dadosGraficoCategoria.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosGraficoCategoria}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {dadosGraficoCategoria.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-400">
              Nenhum gasto registrado neste mês.
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="text-red-500" size={20} />
            <h3 className="text-lg font-semibold text-gray-800">Próximos Vencimentos</h3>
          </div>
          <div className="flex-1 overflow-auto">
            {resumo.proximosVencimentos && resumo.proximosVencimentos.length > 0 ? (
              <ul className="space-y-4">
                {resumo.proximosVencimentos.map((vencimento, idx) => {
                  const status = getVencimentoStatus(vencimento);
                  return (
                    <li key={idx} className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{vencimento.descricao}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            vencimento.tipo === "FATURA" ? "bg-blue-100 text-blue-700" :
                            vencimento.tipo === "GASTO_FIXO" ? "bg-orange-100 text-orange-700" :
                            vencimento.tipo === "DIVIDA" ? "bg-rose-100 text-rose-700" :
                            "bg-emerald-100 text-emerald-700"
                          }`}>
                            {
                              vencimento.tipo === "FATURA" ? "Fatura" :
                              vencimento.tipo === "GASTO_FIXO" ? "Gasto Fixo" :
                              vencimento.tipo === "DIVIDA" ? "PIX A Pagar" :
                              "PIX A Receber"
                            }
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${status.colorClass}`}>
                            {status.label}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-800">{formatCurrency(vencimento.valor)}</p>
                        <p className="text-xs text-gray-500">Dia {vencimento.dia}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400 text-sm">
                Nenhum vencimento previsto.
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="font-semibold text-gray-700">Total:</span>
            <span className="font-bold text-red-600 text-lg">{formatCurrency(resumo.totalProximosVencimentos || 0)}</span>
          </div>
        </div>
      </div>

      {/* Seção de Metas e Investimentos Detalhados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Metas de Gastos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Metas de Gastos do Mês</h3>
          {resumo.metasCategorias && resumo.metasCategorias.length > 0 ? (
            <div className="space-y-4">
              {resumo.metasCategorias.map((m) => {
                const progressVal = Math.min(m.percentual, 100);
                let barColor = "bg-green-500";
                let textColor = "text-green-700";
                let bgBadge = "bg-green-50";
                if (m.excedeu) {
                  barColor = "bg-red-500 animate-pulse";
                  textColor = "text-red-700";
                  bgBadge = "bg-red-50 border-red-200";
                } else if (m.proximoLimite) {
                  barColor = "bg-amber-500";
                  textColor = "text-amber-700";
                  bgBadge = "bg-amber-50 border-amber-200";
                }

                return (
                  <div key={m.categoriaId} className="space-y-1.5">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: m.categoriaCor }}></span>
                        <span className="font-semibold text-gray-700">{m.categoriaNome}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 border rounded-md font-bold ${bgBadge} ${textColor}`}>
                        {m.percentual.toFixed(0)}%
                      </span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-200">
                      <div className={`h-full ${barColor}`} style={{ width: `${progressVal}%` }}></div>
                    </div>

                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Gasto: {formatCurrency(m.gastoMes)}</span>
                      <span>Limite: {formatCurrency(m.metaMensal)}</span>
                    </div>
                    
                    {m.excedeu && (
                      <p className="text-[10px] text-red-600 font-bold flex items-center gap-1">
                        ⚠ Limite mensal excedido em {formatCurrency(m.gastoMes - m.metaMensal)}!
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400 text-sm">
              Nenhuma meta mensal de gastos definida para as categorias.
            </div>
          )}
        </div>

        {/* Detalhamento de Investimentos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">Alocação de Investimentos</h3>
          
          {/* Por Prazo */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Por Tipo de Prazo</h4>
            {resumo.investidoPorPrazo && resumo.investidoPorPrazo.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {resumo.investidoPorPrazo.map((p) => {
                  let prazoLabel = "Não Especificado";
                  let prazoColor = "border-gray-200 bg-gray-50 text-gray-700";
                  if (p.prazo === "CURTO_PRAZO") {
                    prazoLabel = "Curto Prazo";
                    prazoColor = "border-cyan-200 bg-cyan-50 text-cyan-700";
                  } else if (p.prazo === "MEDIO_PRAZO") {
                    prazoLabel = "Médio Prazo";
                    prazoColor = "border-amber-200 bg-amber-50 text-amber-700";
                  } else if (p.prazo === "LONGO_PRAZO") {
                    prazoLabel = "Longo Prazo";
                    prazoColor = "border-indigo-200 bg-indigo-50 text-indigo-700";
                  }

                  return (
                    <div key={p.prazo} className={`border rounded-xl p-3 text-center ${prazoColor}`}>
                      <span className="text-[10px] uppercase font-bold tracking-wider block">{prazoLabel}</span>
                      <span className="text-sm font-black mt-1 block">{formatCurrency(p.valor)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-gray-400">Nenhum aporte registrado.</div>
            )}
          </div>

          {/* Por Caixinha */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Por Objetivo (Caixinha)</h4>
            {resumo.investidoPorCaixinha && resumo.investidoPorCaixinha.length > 0 ? (
              <div className="max-h-36 overflow-y-auto space-y-2">
                {resumo.investidoPorCaixinha.map((c) => (
                  <div key={c.nome} className="flex justify-between items-center text-sm border-b border-gray-50 pb-1.5 last:border-0 last:pb-0">
                    <span className="font-semibold text-gray-700">{c.nome}</span>
                    <span className="font-bold text-gray-900">{formatCurrency(c.valor)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-gray-400">Nenhuma caixinha associada.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
