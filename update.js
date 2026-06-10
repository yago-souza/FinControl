const fs = require('fs');
let c = fs.readFileSync('backend/src/main/java/com/fincontrol/backend/service/DashboardService.java', 'utf8');

let newCode =         BigDecimal totalCartao = BigDecimal.ZERO;
        Map<String, BigDecimal> gastosPorCategoria = new HashMap<>();

        for (Fatura f : faturas) {
            List<LancamentoCartao> lancs = lancamentoRepository.findAll().stream()
                .filter(l -> l.getFatura().getId().equals(f.getId())).collect(Collectors.toList());
            totalCartao = totalCartao.add(lancs.stream().map(LancamentoCartao::getValor).reduce(BigDecimal.ZERO, BigDecimal::add));
            
            for (LancamentoCartao l : lancs) {
                String catNome = (l.getCategoria() != null && l.getCategoria().getNome() != null) ? l.getCategoria().getNome() : "Outros";
                gastosPorCategoria.put(catNome, gastosPorCategoria.getOrDefault(catNome, BigDecimal.ZERO).add(l.getValor()));
            }
        };

c = c.replace(/        BigDecimal totalCartao = BigDecimal.ZERO;[\s\S]*?for \(Fatura f : faturas\) \{[\s\S]*?totalCartao = totalCartao.add[\s\S]*?\}/, newCode);
c = c.replace('resumo.put("totalCartao", totalCartao);', 'resumo.put("totalCartao", totalCartao);\n        resumo.put("gastosPorCategoria", gastosPorCategoria);');
fs.writeFileSync('backend/src/main/java/com/fincontrol/backend/service/DashboardService.java', c);
