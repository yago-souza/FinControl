package com.fincontrol.backend.util;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.apache.poi.ss.usermodel.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class FaturaImportParser {

    @Data
    @AllArgsConstructor
    public static class ParsedRow {
        private LocalDate data;
        private String descricao;
        private BigDecimal valor;
        private Integer parcela;
        private Integer totalParcelas;
    }

    @Data
    @AllArgsConstructor
    public static class InstallmentInfo {
        private String cleanDesc;
        private Integer parcela;
        private Integer totalParcelas;
    }

    public static List<ParsedRow> parse(MultipartFile file) throws Exception {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        List<String[]> rawRows = new ArrayList<>();

        if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
            rawRows = parseExcel(file.getInputStream());
        } else {
            rawRows = parseCsv(file.getInputStream());
        }

        if (rawRows.isEmpty()) {
            return new ArrayList<>();
        }

        // 1. Scan rows to find the actual header row
        int headerRowIdx = -1;
        for (int i = 0; i < rawRows.size(); i++) {
            String[] row = rawRows.get(i);
            if (row.length < 2) continue; // Needs at least 2 columns to be a table
            
            int matches = 0;
            for (String cell : row) {
                String h = sanitizeHeader(cell);
                if (isDateHeader(h) || isDescHeader(h) || isValorHeader(h) || isParcelaHeader(h)) {
                    matches++;
                }
            }
            if (matches >= 2) {
                headerRowIdx = i;
                break;
            }
        }

        // Determine column mapping
        int idxData = -1;
        int idxDesc = -1;
        int idxValor = -1;
        int idxParcelas = -1;
        int dataStartRow = 1;

        if (headerRowIdx != -1) {
            String[] headers = rawRows.get(headerRowIdx);
            for (int i = 0; i < headers.length; i++) {
                String h = sanitizeHeader(headers[i]);
                if (isDateHeader(h)) idxData = i;
                else if (isDescHeader(h)) idxDesc = i;
                else if (isValorHeader(h)) idxValor = i;
                else if (isParcelaHeader(h)) idxParcelas = i;
            }
            dataStartRow = headerRowIdx + 1;
        } else {
            // Fallback heuristics: if no header row found, analyze first row
            String[] firstRow = rawRows.get(0);
            boolean firstRowHasHeader = hasHeader(firstRow);
            if (!firstRowHasHeader) {
                dataStartRow = 0;
            }

            int colsCount = firstRow.length;
            int[] scoresData = new int[colsCount];
            int[] scoresValor = new int[colsCount];
            int[] scoresDesc = new int[colsCount];

            int rowsToInspect = Math.min(rawRows.size(), 10);
            for (int r = dataStartRow; r < rowsToInspect; r++) {
                String[] row = rawRows.get(r);
                for (int c = 0; c < Math.min(row.length, colsCount); c++) {
                    String val = row[c].trim();
                    if (val.isEmpty()) continue;

                    if (looksLikeDate(val)) scoresData[c]++;
                    if (looksLikeNumber(val)) scoresValor[c]++;
                    if (looksLikeTextOnly(val)) scoresDesc[c]++;
                }
            }

            idxData = getHighestScoreIdx(scoresData, -1, -1);
            idxValor = getHighestScoreIdx(scoresValor, idxData, -1);
            idxDesc = getHighestScoreIdx(scoresDesc, idxData, idxValor);
        }

        // Validate that we found at least data, description, and value
        if (idxData == -1 || idxDesc == -1 || idxValor == -1) {
            throw new RuntimeException("Não foi possível identificar as colunas obrigatórias de Data, Descrição e Valor no arquivo.");
        }

        List<ParsedRow> result = new ArrayList<>();
        for (int i = dataStartRow; i < rawRows.size(); i++) {
            String[] row = rawRows.get(i);
            if (row.length <= Math.max(idxData, Math.max(idxDesc, idxValor))) {
                continue; // Skip invalid rows
            }

            String dataStr = row[idxData].trim();
            String descStr = row[idxDesc].trim();
            String valorStr = row[idxValor].trim();
            String parcelaStr = idxParcelas != -1 && row.length > idxParcelas ? row[idxParcelas].trim() : "";

            if (dataStr.isEmpty() || descStr.isEmpty() || valorStr.isEmpty()) {
                continue; // Skip empty rows or footers
            }

            // Skip metadata/footer rows that don't match any date format
            if (!looksLikeDate(dataStr)) {
                continue;
            }

            LocalDate data = parseDate(dataStr);
            BigDecimal valor = parseValor(valorStr);
            InstallmentInfo inst = extractParcelas(descStr, parcelaStr);

            result.add(new ParsedRow(data, inst.getCleanDesc(), valor, inst.getParcela(), inst.getTotalParcelas()));
        }

        return result;
    }

    private static List<String[]> parseCsv(InputStream is) throws Exception {
        List<String[]> rows = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            String line;
            String separator = null;

            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                if (separator == null) {
                    if (line.contains(";")) {
                        separator = ";";
                    } else if (line.contains(",")) {
                        separator = ",";
                    }
                }
                String sep = separator != null ? separator : ",";
                String[] values = line.split(sep + "(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");
                for (int i = 0; i < values.length; i++) {
                    values[i] = values[i].replace("\"", "").trim();
                }
                rows.add(values);
            }
        }
        return rows;
    }

    private static List<String[]> parseExcel(InputStream is) throws Exception {
        List<String[]> rows = new ArrayList<>();
        try (Workbook workbook = WorkbookFactory.create(is)) {
            if (workbook.getNumberOfSheets() == 0) return rows;
            Sheet sheet = workbook.getSheetAt(0);

            for (Row row : sheet) {
                int maxCell = row.getLastCellNum();
                if (maxCell <= 0) continue;
                String[] cells = new String[maxCell];
                boolean hasContent = false;
                for (int c = 0; c < maxCell; c++) {
                    Cell cell = row.getCell(c);
                    cells[c] = getCellValueAsString(cell).trim();
                    if (!cells[c].isEmpty()) {
                        hasContent = true;
                    }
                }
                if (hasContent) {
                    rows.add(cells);
                }
            }
        }
        return rows;
    }

    private static String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    LocalDate date = cell.getLocalDateTimeCellValue().toLocalDate();
                    return date.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                }
                double num = cell.getNumericCellValue();
                if (num == Math.floor(num)) {
                    return String.format("%.0f", num);
                }
                return String.valueOf(num);
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try {
                    return cell.getStringCellValue();
                } catch (Exception e) {
                    try {
                        double numVal = cell.getNumericCellValue();
                        if (numVal == Math.floor(numVal)) {
                            return String.format("%.0f", numVal);
                        }
                        return String.valueOf(numVal);
                    } catch (Exception ex) {
                        return "";
                    }
                }
            default:
                return "";
        }
    }

    private static String sanitizeHeader(String h) {
        if (h == null) return "";
        return h.toLowerCase()
                .trim()
                .replace("\"", "")
                .replaceAll("[áàâãä]", "a")
                .replaceAll("[éèêë]", "e")
                .replaceAll("[íìîï]", "i")
                .replaceAll("[óòôõö]", "o")
                .replaceAll("[úùûü]", "u")
                .replaceAll("[ç]", "c");
    }

    private static boolean isDateHeader(String h) {
        return h.equals("data") || h.equals("date") || h.contains("data da") || h.contains("data de") || h.contains("dt.compra") || h.contains("dt.trans") || h.contains("vencimento") || h.equals("dia") || h.contains("transacao");
    }

    private static boolean isDescHeader(String h) {
        if (h.contains("cartao") || h.contains("titular") || h.contains("numero")) return false;
        return h.contains("desc") || h.contains("title") || h.contains("historico") || h.contains("estabelecimento") || h.contains("detalhe") || h.equals("nome") || h.contains("lancamento") || h.equals("itens") || h.equals("item");
    }

    private static boolean isValorHeader(String h) {
        if (h.contains("cartao") || h.contains("titular") || h.contains("numero") || h.contains("tipo")) return false;
        return h.contains("valor") || h.contains("amount") || h.contains("preco") || h.contains("total") || h.equals("debito") || h.equals("credito");
    }

    private static boolean isParcelaHeader(String h) {
        return h.contains("parcela") || h.contains("prestacao") || h.contains("vezes") || h.contains("nro") || h.equals("qtd") || h.contains("parc");
    }

    private static boolean hasHeader(String[] firstRow) {
        int matched = 0;
        for (String val : firstRow) {
            String h = sanitizeHeader(val);
            if (isDateHeader(h) || isDescHeader(h) || isValorHeader(h) || isParcelaHeader(h)) {
                matched++;
            }
        }
        return matched >= 2;
    }

    private static boolean looksLikeDate(String val) {
        return val.matches("\\d{2}/\\d{2}/\\d{4}") ||
               val.matches("\\d{4}-\\d{2}-\\d{2}") ||
               val.matches("\\d{2}/\\d{2}/\\d{2}") ||
               val.matches("\\d{2}-\\d{2}-\\d{4}") ||
               val.matches("\\d{4}/\\d{2}/\\d{2}");
    }

    private static boolean looksLikeNumber(String val) {
        String clean = val.replace("R$", "").replace("$", "").trim();
        return clean.matches("^-?\\d+[.,]?\\d*$") || clean.matches("^-?\\d{1,3}([.]\\d{3})*[,]?\\d*$") || clean.matches("^-?\\d{1,3}([,]\\d{3})*[.]?\\d*$");
    }

    private static boolean looksLikeTextOnly(String val) {
        return !looksLikeDate(val) && !looksLikeNumber(val) && val.length() > 3;
    }

    private static int getHighestScoreIdx(int[] scores, int exclude1, int exclude2) {
        int max = -1;
        int maxIdx = -1;
        for (int i = 0; i < scores.length; i++) {
            if (i == exclude1 || i == exclude2) continue;
            if (scores[i] > max) {
                max = scores[i];
                maxIdx = i;
            }
        }
        return max > 0 ? maxIdx : -1;
    }

    public static LocalDate parseDate(String val) {
        String clean = val.trim();
        if (clean.isEmpty()) return LocalDate.now();

        String[] formats = {
                "yyyy-MM-dd", "dd/MM/yyyy", "dd/MM/yy", "dd-MM-yyyy", "yyyy/MM/dd", "dd/MM"
        };

        for (String fmt : formats) {
            try {
                if (fmt.equals("dd/MM")) {
                    DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/" + LocalDate.now().getYear());
                    return LocalDate.parse(clean + "/" + LocalDate.now().getYear(), dtf);
                }
                return LocalDate.parse(clean, DateTimeFormatter.ofPattern(fmt));
            } catch (Exception ignored) {}
        }

        return LocalDate.now();
    }

    public static BigDecimal parseValor(String val) {
        if (val == null) return BigDecimal.ZERO;
        String clean = val.replace("R$", "")
                .replace("$", "")
                .replace("\"", "")
                .replaceAll("\\s", "")
                .trim();

        if (clean.isEmpty()) return BigDecimal.ZERO;

        // Handle negative formats, e.g. 150.00- or (150.00)
        boolean isNegative = false;
        if (clean.startsWith("-")) {
            isNegative = true;
            clean = clean.substring(1);
        } else if (clean.endsWith("-")) {
            isNegative = true;
            clean = clean.substring(0, clean.length() - 1);
        } else if (clean.startsWith("(") && clean.endsWith(")")) {
            isNegative = true;
            clean = clean.substring(1, clean.length() - 1);
        }

        // Determine decimal separator
        int lastComma = clean.lastIndexOf(',');
        int lastDot = clean.lastIndexOf('.');

        if (lastComma > lastDot) {
            clean = clean.replace(".", "").replace(',', '.');
        } else if (lastDot > lastComma) {
            clean = clean.replace(",", "");
        }

        try {
            BigDecimal res = new BigDecimal(clean);
            return isNegative ? res.negate() : res;
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    public static InstallmentInfo extractParcelas(String desc, String valParcela) {
        Integer p = 1;
        Integer t = 1;

        if (valParcela != null && !valParcela.trim().isEmpty()) {
            String cleanPart = valParcela.trim().toLowerCase();
            Pattern p1 = Pattern.compile("(\\d+)\\s*/\\s*(\\d+)");
            Pattern p2 = Pattern.compile("(\\d+)\\s*de\\s*(\\d+)");
            Pattern p3 = Pattern.compile("^\\d+$");

            Matcher m1 = p1.matcher(cleanPart);
            Matcher m2 = p2.matcher(cleanPart);
            Matcher m3 = p3.matcher(cleanPart);

            if (m1.find()) {
                p = Integer.parseInt(m1.group(1));
                t = Integer.parseInt(m1.group(2));
                return new InstallmentInfo(desc, p, t);
            } else if (m2.find()) {
                p = Integer.parseInt(m2.group(1));
                t = Integer.parseInt(m2.group(2));
                return new InstallmentInfo(desc, p, t);
            } else if (m3.find()) {
                p = Integer.parseInt(m3.group());
                t = p;
                return new InstallmentInfo(desc, p, t);
            }
        }

        Pattern pat1 = Pattern.compile("\\(?\\b(\\d{1,2})\\s*/\\s*(\\d{1,2})\\b\\)?");
        Pattern pat2 = Pattern.compile("\\(?\\b(\\d{1,2})\\s*de\\s*(\\d{1,2})\\b\\)?");
        Pattern pat3 = Pattern.compile("\\bparc\\.?\\s*(\\d{1,2})\\b");

        Matcher mat1 = pat1.matcher(desc);
        if (mat1.find()) {
            p = Integer.parseInt(mat1.group(1));
            t = Integer.parseInt(mat1.group(2));
            String cleanDesc = cleanDescription(desc, mat1.start(), mat1.end());
            return new InstallmentInfo(cleanDesc, p, t);
        }

        Matcher mat2 = pat2.matcher(desc);
        if (mat2.find()) {
            p = Integer.parseInt(mat2.group(1));
            t = Integer.parseInt(mat2.group(2));
            String cleanDesc = cleanDescription(desc, mat2.start(), mat2.end());
            return new InstallmentInfo(cleanDesc, p, t);
        }

        Matcher mat3 = pat3.matcher(desc);
        if (mat3.find()) {
            p = Integer.parseInt(mat3.group(1));
            t = p;
            String cleanDesc = cleanDescription(desc, mat3.start(), mat3.end());
            return new InstallmentInfo(cleanDesc, p, t);
        }

        return new InstallmentInfo(desc, p, t);
    }

    private static String cleanDescription(String desc, int start, int end) {
        String clean = desc.substring(0, start) + " " + desc.substring(end);
        return clean.replaceAll("\\(\\s*\\)", "")
                .replaceAll("\\[\\s*\\]", "")
                .replace("-  ", " ")
                .replace(" - ", " ")
                .replaceAll("\\s{2,}", " ")
                .trim();
    }
}
