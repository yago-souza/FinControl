import React from 'react';
import { CreditCard, CalendarDays, TrendingUp, LayoutDashboard } from 'lucide-react';

const Instrucoes = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto text-gray-800">
      <h1 className="text-3xl font-bold text-blue-700 mb-6 border-b pb-2">Como usar o FinControl</h1>
      
      <p className="text-lg mb-8 text-gray-600">
        Bem-vindo ao FinControl! Este guia rápido ajudará você a entender como utilizar cada seção do sistema para manter sua vida financeira organizada.
      </p>

      <div className="space-y-8">
        
        {/* Seção Faturas */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <CreditCard size={24} />
            </div>
            <h2 className="text-2xl font-semibold">Faturas de Cartão de Crédito</h2>
          </div>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-2">
            <li>Acesse a página de <strong>Faturas</strong> pelo menu lateral.</li>
            <li>Você pode adicionar lançamentos manualmente ou importar o arquivo da fatura gerado pelo seu banco.</li>
            <li>Categorize cada gasto (ex: Alimentação, Transporte, Lazer) para ter relatórios precisos no Dashboard.</li>
            <li>Acompanhe o fechamento e o vencimento da sua fatura para não atrasar pagamentos.</li>
          </ul>
        </section>

        {/* Seção Gastos Fixos */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <CalendarDays size={24} />
            </div>
            <h2 className="text-2xl font-semibold">Gastos Fixos</h2>
          </div>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-2">
            <li>Acesse a página de <strong>Gastos Fixos</strong> para cadastrar contas recorrentes.</li>
            <li>Adicione despesas como Aluguel, Água, Luz, Internet e Assinaturas (Netflix, Spotify, etc).</li>
            <li>Estes valores são projetados mensalmente, ajudando você a saber qual será sua despesa base antes mesmo do mês começar.</li>
            <li>Você pode marcar contas como pagas no mês atual para controlar o que ainda está pendente.</li>
          </ul>
        </section>

        {/* Seção Investimentos */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <TrendingUp size={24} />
            </div>
            <h2 className="text-2xl font-semibold">Investimentos</h2>
          </div>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-2">
            <li>Na seção <strong>Investimentos</strong>, registre todos os seus aportes mensais.</li>
            <li>Categorize por tipo (Renda Fixa, Ações, FIIs, etc) para analisar a distribuição da sua carteira.</li>
            <li>O sistema permite que você crie metas de economia e acompanhe o quanto você já conseguiu guardar no mês.</li>
          </ul>
        </section>

        {/* Seção Dashboard */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
              <LayoutDashboard size={24} />
            </div>
            <h2 className="text-2xl font-semibold">Dashboard e Relatórios</h2>
          </div>
          <p className="text-gray-700 mb-3 ml-2">
            O <strong>Dashboard</strong> é a tela principal do sistema e centraliza as informações:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-2">
            <li>Visualize gráficos de pizza e barra que mostram para onde seu dinheiro está indo.</li>
            <li>Veja um resumo rápido: Total de Gastos Fixos + Total de Faturas = Custo do Mês.</li>
            <li>Acompanhe alertas caso você esteja próximo de ultrapassar orçamentos definidos por categoria.</li>
          </ul>
        </section>

      </div>
    </div>
  );
};

export default Instrucoes;
