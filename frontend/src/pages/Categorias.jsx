import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit2, Tag } from 'lucide-react';

const API_URL = 'http://localhost:8080/api/categorias';

const PRESET_COLORS = [
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Esmeralda', value: '#10b981' },
  { name: 'Âmbar', value: '#f59e0b' },
  { name: 'Rosa', value: '#f43f5e' },
  { name: 'Roxo', value: '#8b5cf6' },
  { name: 'Índigo', value: '#6366f1' },
  { name: 'Ciano', value: '#06b6d4' },
  { name: 'Cinza', value: '#6b7280' },
];

const Categorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: null, nome: '', cor: '#3b82f6', regras: [] });
  const [newKeyword, setNewKeyword] = useState('');

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setCategorias(response.data);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  const openModal = (categoria = null) => {
    if (categoria) {
      setFormData({
        id: categoria.id,
        nome: categoria.nome,
        cor: categoria.cor || '#3b82f6',
        regras: categoria.regras ? [...categoria.regras] : []
      });
    } else {
      setFormData({ id: null, nome: '', cor: '#3b82f6', regras: [] });
    }
    setNewKeyword('');
    setShowModal(true);
  };

  const handleAddKeyword = (e) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    
    // Check for duplicates in memory
    const keywordLower = newKeyword.trim().toLowerCase();
    const exists = formData.regras.some(r => r.palavraChave.toLowerCase() === keywordLower);
    
    if (exists) {
      alert('Esta palavra-chave já foi adicionada.');
      return;
    }

    setFormData({
      ...formData,
      regras: [...formData.regras, { palavraChave: newKeyword.trim() }]
    });
    setNewKeyword('');
  };

  const handleRemoveKeyword = (indexToRemove) => {
    setFormData({
      ...formData,
      regras: formData.regras.filter((_, idx) => idx !== indexToRemove)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome.trim()) return;

    try {
      if (formData.id) {
        await axios.put(`${API_URL}/${formData.id}`, formData);
      } else {
        await axios.post(API_URL, formData);
      }
      setShowModal(false);
      fetchCategorias();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      alert('Erro ao salvar categoria.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Ao excluir esta categoria, as transações associadas perderão a referência. Deseja continuar?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        fetchCategorias();
      } catch (error) {
        console.error('Erro ao excluir categoria:', error);
        alert('Erro ao excluir categoria.');
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Categorias</h2>
          <p className="text-gray-600">Cadastro de categorias de gastos e regras de auto-categorização.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Nova Categoria
        </button>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categorias.map((cat) => (
            <div key={cat.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-4 h-4 rounded-full inline-block" 
                      style={{ backgroundColor: cat.cor }}
                    />
                    <h3 className="text-lg font-bold text-gray-800">{cat.nome}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openModal(cat)} 
                      className="text-yellow-600 hover:text-yellow-800 p-1"
                      title="Editar Categoria"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(cat.id)} 
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Excluir Categoria"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Regras de auto-classificação:</p>
                  <div className="flex flex-wrap gap-1.5 min-h-[40px]">
                    {cat.regras && cat.regras.length > 0 ? (
                      cat.regras.map((regra, ruleIndex) => (
                        <span 
                          key={regra.id || ruleIndex} 
                          className="bg-gray-50 text-gray-700 text-xs px-2.5 py-1 rounded-full border border-gray-200 font-medium"
                        >
                          "{regra.palavraChave}"
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">Sem regras cadastradas.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {categorias.length === 0 && (
            <div className="col-span-full bg-white rounded-lg p-10 text-center text-gray-500 border border-dashed">
              Nenhuma categoria cadastrada. Crie uma para começar a organizar seus lançamentos!
            </div>
          )}
        </div>
      )}

      {/* MODAL: Criar / Editar Categoria */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4">{formData.id ? 'Editar Categoria' : 'Nova Categoria'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome da Categoria</label>
                <input 
                  required 
                  type="text" 
                  value={formData.nome} 
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })} 
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Ex: Alimentação, Transporte"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cor Identificadora</label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, cor: color.value })}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium ${formData.cor === color.value ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                      <span className="w-5 h-5 rounded-full" style={{ backgroundColor: color.value }} />
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700">Regras de Palavra-Chave</label>
                <p className="text-xs text-gray-500 mb-2">Qualquer compra com essa palavra-chave será automaticamente associada a esta categoria.</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newKeyword} 
                    onChange={(e) => setNewKeyword(e.target.value)} 
                    className="flex-1 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                    placeholder="Ex: UBER, NETFLIX, CARREFOUR"
                  />
                  <button 
                    type="button" 
                    onClick={handleAddKeyword}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-100 max-h-32 overflow-y-auto">
                  <div className="flex flex-wrap gap-1.5">
                    {formData.regras.map((regra, idx) => (
                      <span 
                        key={idx} 
                        className="bg-white text-gray-800 text-xs px-2.5 py-1 rounded-full border border-gray-200 flex items-center gap-1.5"
                      >
                        "{regra.palavraChave}"
                        <button 
                          type="button" 
                          onClick={() => handleRemoveKeyword(idx)}
                          className="text-red-500 hover:text-red-700 font-bold"
                          title="Remover"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {formData.regras.length === 0 && (
                      <span className="text-xs text-gray-400 italic">Nenhuma regra adicionada.</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categorias;
