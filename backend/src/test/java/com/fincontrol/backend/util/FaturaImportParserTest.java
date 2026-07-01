package com.fincontrol.backend.util;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class FaturaImportParserTest {

    @Test
    void testParseDate() {
        assertEquals(LocalDate.of(2026, 6, 30), FaturaImportParser.parseDate("2026-06-30"));
        assertEquals(LocalDate.of(2026, 6, 30), FaturaImportParser.parseDate("30/06/2026"));
        assertEquals(LocalDate.of(2026, 6, 30), FaturaImportParser.parseDate("30/06/26"));
        assertEquals(LocalDate.of(2026, 6, 30), FaturaImportParser.parseDate("30-06-2026"));
        assertEquals(LocalDate.of(2026, 6, 30), FaturaImportParser.parseDate("2026/06/30"));
    }

    @Test
    void testParseValor() {
        // Absolute values
        assertEquals(new BigDecimal("1500.60"), FaturaImportParser.parseValor("R$ 1.500,60"));
        assertEquals(new BigDecimal("1500.60"), FaturaImportParser.parseValor("R$ 1,500.60"));
        assertEquals(new BigDecimal("1250.50"), FaturaImportParser.parseValor("1250,50"));
        assertEquals(new BigDecimal("1250.50"), FaturaImportParser.parseValor("1250.50"));
        assertEquals(new BigDecimal("1250.50"), FaturaImportParser.parseValor("-1250.50"));
        assertEquals(new BigDecimal("1250.50"), FaturaImportParser.parseValor("1250.50-"));
        assertEquals(new BigDecimal("50.00"), FaturaImportParser.parseValor("(50,00)"));
    }

    @Test
    void testExtractParcelasFromDescription() {
        // Pattern 1: X/Y
        FaturaImportParser.InstallmentInfo i1 = FaturaImportParser.extractParcelas("Mercado do Bairro 02/05", "");
        assertEquals("Mercado do Bairro", i1.getCleanDesc());
        assertEquals(2, i1.getParcela());
        assertEquals(5, i1.getTotalParcelas());

        // Pattern 2: X de Y
        FaturaImportParser.InstallmentInfo i2 = FaturaImportParser.extractParcelas("Lojas Americanas (3 de 10)", "");
        assertEquals("Lojas Americanas", i2.getCleanDesc());
        assertEquals(3, i2.getParcela());
        assertEquals(10, i2.getTotalParcelas());

        // Pattern 3: parc X
        FaturaImportParser.InstallmentInfo i3 = FaturaImportParser.extractParcelas("Assinatura parc 4", "");
        assertEquals("Assinatura", i3.getCleanDesc());
        assertEquals(4, i3.getParcela());
        assertEquals(4, i3.getTotalParcelas());
    }

    @Test
    void testExtractParcelasFromColumn() {
        FaturaImportParser.InstallmentInfo i1 = FaturaImportParser.extractParcelas("Netflix", "3/12");
        assertEquals("Netflix", i1.getCleanDesc());
        assertEquals(3, i1.getParcela());
        assertEquals(12, i1.getTotalParcelas());

        FaturaImportParser.InstallmentInfo i2 = FaturaImportParser.extractParcelas("Amazon Prime", "2 de 6");
        assertEquals("Amazon Prime", i2.getCleanDesc());
        assertEquals(2, i2.getParcela());
        assertEquals(6, i2.getTotalParcelas());

        FaturaImportParser.InstallmentInfo i3 = FaturaImportParser.extractParcelas("Academia", "5");
        assertEquals("Academia", i3.getCleanDesc());
        assertEquals(5, i3.getParcela());
        assertEquals(5, i3.getTotalParcelas());
    }

    @Test
    void testHeuristicsAndParsingCsv() throws Exception {
        // A CSV with scrambled column order, weird headers, and custom formatting
        String csvContent = "Preço total;Data da Compra;Estabelecimento;Qtd Parcelas\n" +
                "R$ 150,00;30/06/2026;Supermercado ABC;1/3\n" +
                "50.50;2026-07-01;Posto de Gasolina;2/2\n";

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "fatura.csv",
                "text/csv",
                csvContent.getBytes()
        );

        List<FaturaImportParser.ParsedRow> rows = FaturaImportParser.parse(file);

        assertEquals(2, rows.size());

        // Row 1
        FaturaImportParser.ParsedRow r1 = rows.get(0);
        assertEquals(LocalDate.of(2026, 6, 30), r1.getData());
        assertEquals("Supermercado ABC", r1.getDescricao());
        assertEquals(new BigDecimal("150.00"), r1.getValor());
        assertEquals(1, r1.getParcela());
        assertEquals(3, r1.getTotalParcelas());

        // Row 2
        FaturaImportParser.ParsedRow r2 = rows.get(1);
        assertEquals(LocalDate.of(2026, 7, 1), r2.getData());
        assertEquals("Posto de Gasolina", r2.getDescricao());
        assertEquals(new BigDecimal("50.50"), r2.getValor());
        assertEquals(2, r2.getParcela());
        assertEquals(2, r2.getTotalParcelas());
    }
}
