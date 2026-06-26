import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit2, CheckSquare, Square } from 'lucide-react';

const API_URL = 'http://localhost:8080/api/gastos-fixos';

const GastosFixos = () => {
  const [gastos, setGastos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: null, nome: '', tipo: 'CONTA', valor: '', diaVencimento: '', ativo: true, pago: false, categoriaIds: [] });

  const fetchGastos = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setGastos(response.data);
    } catch (error) {
      console.error("Erro ao buscar gastos fixos:", error);
    }
    setLoading(false);
  };

  const fetchCategorias = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/categorias');
      setCategorias(response.data);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  };

  useEffect(() => {
    fetchGastos();
    fetchCategorias();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API_URL, {
        ...formData,
        valor: parseFloat(formData.valor),
        categorias: formData.categoriaIds.map(id => ({ id: parseInt(id) }))
      });
      setShowModal(false);
      fetchGastos();
    } catch (error) {
      console.error("Erro ao salvar gasto fixo:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja realmente excluir este gasto?")) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        fetchGastos();
      } catch (error) {
        console.error("Erro ao excluir gasto fixo:", error);
      }
    }
  };

  const handleTogglePagoGasto = async (gasto) => {
    try {
      const novoStatus = !gasto.pago;
      await axios.put(`${API_URL}/${gasto.id}/pagar`, null, {
        params: { pago: novoStatus }
      });
      fetchGastos();
    } catch (error) {
      console.error("Erro ao alterar status de pagamento do gasto fixo:", error);
    }
  };

  const openModal = (gasto = null) => {
    if (gasto) {
      setFormData({ 
        ...gasto, 
        pago: gasto.pago || false,
        categoriaIds: gasto.categorias ? gasto.categorias.map(c => c.id) : []
      });
    } else {
      setFormData({ id: null, nome: '', tipo: 'CONTA', valor: '', diaVencimento: '', ativo: true, pago: false, categoriaIds: [] });
    }
    setShowModal(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Gastos Fixos</h2>
          <p className="text-gray-600">Gerenciamento de contas de consumo e assinaturas.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Novo Gasto
        </button>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categorias</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pagamento</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {gastos.map((gasto) => (
                <tr key={gasto.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{gasto.nome}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{gasto.tipo}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {gasto.categorias && gasto.categorias.length > 0 ? (
                        gasto.categorias.map((cat) => (
                          <span 
                            key={cat.id}
                            className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full"
                            style={{ backgroundColor: `${cat.cor}20`, color: cat.cor }}
                          >
                            {cat.nome}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-xs">Sem categoria</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(gasto.valor)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">Dia {gasto.diaVencimento}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${gasto.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {gasto.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${gasto.pago ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {gasto.pago ? 'Pago' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleTogglePagoGasto(gasto)} 
                      className={`${gasto.pago ? 'text-green-600 hover:text-green-900' : 'text-gray-400 hover:text-gray-600'} mr-3`} 
                      title={gasto.pago ? "Marcar como Pendente" : "Marcar como Pago"}
                    >
                      {gasto.pago ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                    <button onClick={() => openModal(gasto)} className="text-blue-600 hover:text-blue-900 mr-3">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(gasto.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {gastos.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">Nenhum gasto fixo cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{formData.id ? 'Editar Gasto' : 'Novo Gasto Fixo'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input required type="text" name="nome" value={formData.nome} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                <select name="tipo" value={formData.tipo} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="CONTA">Conta</option>
                  <option value="ASSINATURA">Assinatura</option>
                  <option value="FINANCIAMENTO">Financiamento</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categorias</label>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200 max-h-32 overflow-y-auto">
                  {categorias.map((cat) => {
                    const isChecked = formData.categoriaIds.includes(cat.id);
                    return (
                      <label key={cat.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={(e) => {
                            const newIds = e.target.checked 
                              ? [...formData.categoriaIds, cat.id]
                              : formData.categoriaIds.filter(id => id !== cat.id);
                            setFormData({...formData, categoriaIds: newIds});
                          }}
                          className="rounded text-blue-600 border-gray-300 focus:ring-blue-500" 
                        />
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: cat.cor }} />
                        {cat.nome}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Valor (R$)</label>
                <input required type="number" step="0.01" name="valor" value={formData.valor} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Dia de Vencimento</label>
                <input required type="number" min="1" max="31" name="diaVencimento" value={formData.diaVencimento} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center">
                  <input type="checkbox" name="ativo" checked={formData.ativo} onChange={handleChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                  <label className="ml-2 block text-sm text-gray-900">Ativo</label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" name="pago" checked={formData.pago} onChange={handleChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                  <label className="ml-2 block text-sm text-gray-900">Pago</label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GastosFixos;
