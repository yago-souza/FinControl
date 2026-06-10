import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { CreditCard, CalendarDays, TrendingUp, Wallet, AlertCircle } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#F4A460', '#DDA0DD'];

export default function Dashboard() {
  const [resumo, setResumo] = useState(null);
  const [mesAno, setMesAno] = useState(() => {
    const data = new Date();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    return `${mes}/${data.getFullYear()}`;
  });

  useEffect(() => {
    fetchResumo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesAno]);

  const fetchResumo = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/dashboard?mesAno=${encodeURIComponent(mesAno)}`);
      setResumo(response.data);
    } catch (error) {
      console.error('Erro ao buscar resumo:', error);
    }
  };

  if (!resumo) return <div className="p-6">Carregando dashboard...</div>;

  const dadosGraficoCategoria = Object.entries(resumo.gastosPorCategoria || {}).map(([name, value]) => ({
    name,
    value
  }));

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Mês/Ano:</label>
          <input 
            type="text" 
            value={mesAno} 
            onChange={(e) => setMesAno(e.target.value)} 
            placeholder="MM/YYYY"
            className="border rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Gastos por Categoria (Cartão)</h3>
          {dadosGraficoCategoria.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosGraficoCategoria}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
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
                {resumo.proximosVencimentos.map((vencimento, idx) => (
                  <li key={idx} className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{vencimento.descricao}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${vencimento.tipo === 'FATURA' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {vencimento.tipo === 'FATURA' ? 'Fatura' : 'Gasto Fixo'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">{formatCurrency(vencimento.valor)}</p>
                      <p className="text-xs text-gray-500">Dia {vencimento.dia}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400 text-sm">
                Nenhum vencimento previsto.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
