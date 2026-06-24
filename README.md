# FinControl - Controle de Gastos Pessoal

FinControl é uma aplicação moderna para controle de finanças pessoais, focada em organizar e classificar seus gastos de cartão de crédito e contas fixas recorrentes de maneira prática e automatizada.

## 🚀 Arquitetura e Tecnologias

A aplicação é dividida em duas partes principais:

### Backend
- **Framework:** Java Spring Boot 3.2.4
- **Versão do Java:** Java 21
- **Banco de Dados:** SQLite (arquivo local `db/controle.db`)
- **Persistência:** Spring Data JPA + Hibernate (dialeto comunitário do SQLite)
- **Compilação e Gerenciamento:** Maven
- **Lombok:** Utilizado para reduzir código boilerplate (getters, setters, construtores).
- **Agendamento (Scheduling):** Spring Boot Scheduler ativado para automações de banco de dados.

### Frontend
- **Framework:** React
- **Build Tool:** Vite + Rolldown
- **Estilização:** TailwindCSS v4 + Vanilla CSS
- **Ícones:** Lucide React
- **Gráficos:** Recharts (gráfico de pizza interativo para divisão de categorias)
- **Comunicação:** Axios

---

## ✨ Funcionalidades Principais

1. **Dashboard Financeiro Completo:**
   - Resumo consolidado de gastos do mês corrente (saídas de cartão à vista, parceladas, gastos fixos e total investido).
   - Gráfico de pizza interativo mostrando a distribuição de despesas por categoria.
   - **Próximos Vencimentos:** Painel ordenado por dia de vencimento contendo cartões e gastos fixos, classificados com cores de status dinâmicas:
     - 🟢 **Pago:** Itens já quitados no período.
     - 🟡 **Pendente:** Contas a pagar com vencimento no dia de hoje ou futuro.
     - 🔴 **Atrasado:** Contas não pagas cujo dia de vencimento já passou (baseado no período do painel em relação à data atual).

2. **Gestão de Cartões e Faturas:**
   - Cadastro e listagem de cartões de crédito.
   - Importação de faturas via arquivos CSV (extrato de cartão).
   - Visualização detalhada de lançamentos da fatura.
   - **Lançamentos Manuais:** Possibilidade de adicionar manualmente novos lançamentos em faturas existentes (especificando descrição, valor, data, parcelas e categorias).
   - Edição e remoção de lançamentos e faturas.

3. **Gerenciamento de Categorias de Gastos:**
   - CRUD completo de categorias (Nome e Cor identificadora).
   - **Categorias Múltiplas:** Suporte para associar mais de uma categoria a uma mesma transação (lançamento).
   - **Rateio Proporcional:** O Dashboard divide automaticamente o valor de transações multicategorias de forma igual entre os gráficos (ex: compra de R$ 100 associada a duas categorias soma R$ 50 para cada uma).
   - **Regras de Auto-categorização por Palavra-Chave:** Definição de substrings que, se encontradas na descrição da compra, classificam a transação de forma totalmente automatizada no momento da importação do CSV ou criação manual (ex: termos como `UBER` classificam em `Transporte`, `NETFLIX` em `Lazer`).

4. **Gastos Fixos Recorrentes:**
   - Cadastro de contas e assinaturas (Água, Energia, Internet, Streaming, etc.) definindo o dia de vencimento.
   - Marcação rápida de pago/pendente diretamente na listagem ou formulários.
   - **Reset Automático Mensal:** Um agendador em segundo plano reseta automaticamente o status de pagamento de todas as despesas fixas ativas para *não pago* (pendente) à meia-noite de todo dia 1º, preparando o novo mês financeiro.

---

## 🛠️ Como Executar o Projeto

### Pré-requisitos
- **Java 21** instalado.
- **Maven** instalado e configurado no PATH do sistema.
- **Node.js** (versão 18+) e **npm** instalados.

### Inicialização Simplificada (Windows)
Na raiz do projeto, basta clicar duas vezes ou executar no terminal o arquivo:
```bash
iniciar.bat
```
Este script de lote irá:
1. Fechar processos antigos que possam estar utilizando as portas `8080` (Backend) ou `5173` (Frontend).
2. Iniciar o backend Spring Boot em uma nova janela (`mvn spring-boot:run`).
3. Iniciar o frontend Vite em uma nova janela (`npm run dev`).

### Inicialização Manual

#### 1. Backend
```bash
cd backend
mvn spring-boot:run
```
O servidor estará disponível em: `http://localhost:8080`
O console Swagger da API estará disponível em: `http://localhost:8080/swagger-ui/index.html`

#### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
A interface do usuário estará disponível em: `http://localhost:5173`
