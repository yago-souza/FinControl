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

        // Determine column mapping
        int idxData = -1;
        int idxDesc = -1;
        int idxValor = -1;
        int idxParcelas = -1;

        // Try mapping via headers in the first row
        String[] headers = rawRows.get(0);
        for (int i = 0; i < headers.length; i++) {
            String h = sanitizeHeader(headers[i]);
            if (isDateHeader(h)) idxData = i;
            else if (isDescHeader(h)) idxDesc = i;
            else if (isValorHeader(h)) idxValor = i;
            else if (isParcelaHeader(h)) idxParcelas = i;
        }

        int dataStartRow = 1;

        // Fallback heuristics: if mapping failed, analyze rows of data to guess columns
        if (idxData == -1 || idxDesc == -1 || idxValor == -1) {
            // Check if the first row is actually data (no headers)
            boolean firstRowHasHeader = hasHeader(headers);
            if (!firstRowHasHeader) {
                dataStartRow = 0;
            }

            int colsCount = headers.length;
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

            // Assign indices based on highest scores
            if (idxData == -1) idxData = getHighestScoreIdx(scoresData, -1, -1);
            if (idxValor == -1) idxValor = getHighestScoreIdx(scoresValor, idxData, -1);
            if (idxDesc == -1) idxDesc = getHighestScoreIdx(scoresDesc, idxData, idxValor);
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

            if (dataStr.isEmpty() && descStr.isEmpty() && valorStr.isEmpty()) {
                continue; // Skip empty rows
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
                    separator = line.contains(";") ? ";" : ",";
                }
                // Regex splits taking care of quoted text with commas/semicolons
                String[] values = line.split(separator + "(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");
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
        return h.equals("data") || h.equals("date") || h.contains("vencimento") || h.equals("dia") || h.contains("transacao");
    }

    private static boolean isDescHeader(String h) {
        return h.contains("desc") || h.contains("title") || h.contains("historico") || h.contains("estabelecimento") || h.contains("detalhe") || h.equals("nome");
    }

    private static boolean isValorHeader(String h) {
        return h.contains("valor") || h.contains("amount") || h.contains("preco") || h.contains("total") || h.contains("debito") || h.contains("credito") || h.contains("lancamento");
    }

    private static boolean isParcelaHeader(String h) {
        return h.contains("parcela") || h.contains("prestacao") || h.contains("vezes") || h.contains("nro") || h.equals("qtd");
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
                    // Handle missing year, append current year
                    DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/" + LocalDate.now().getYear());
                    return LocalDate.parse(clean + "/" + LocalDate.now().getYear(), dtf);
                }
                return LocalDate.parse(clean, DateTimeFormatter.ofPattern(fmt));
            } catch (Exception ignored) {}
        }

        // Last fallback, return current date
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
        if (clean.startsWith("-") || clean.endsWith("-")) {
            isNegative = true;
            clean = clean.replace("-", "");
        } else if (clean.startsWith("(") && clean.endsWith(")")) {
            isNegative = true;
            clean = clean.substring(1, clean.length() - 1);
        }

        // Determine decimal separator
        int lastComma = clean.lastIndexOf(',');
        int lastDot = clean.lastIndexOf('.');

        if (lastComma > lastDot) {
            // comma is decimal separator (e.g. 1.250,50 or 1250,50)
            clean = clean.replace(".", "").replace(',', '.');
        } else if (lastDot > lastComma) {
            // dot is decimal separator (e.g. 1,250.50 or 1250.50)
            clean = clean.replace(",", "");
        }

        try {
            BigDecimal res = new BigDecimal(clean);
            // By requirement: use absolute value for transactions
            return res.abs();
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    public static InstallmentInfo extractParcelas(String desc, String valParcela) {
        Integer p = 1;
        Integer t = 1;

        // 1. First check if we have a separate installment column value
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
                t = p; // If it's just a single number, assume it could be total or just current, set both as fallback
                return new InstallmentInfo(desc, p, t);
            }
        }

        // 2. Fallback: Parse description using regex patterns
        // Pattern 1: (02/05) or 02/05 or 1/12
        Pattern pat1 = Pattern.compile("\\(?\\b(\\d{1,2})\\s*/\\s*(\\d{1,2})\\b\\)?");
        // Pattern 2: 2 de 5 or (2 de 5)
        Pattern pat2 = Pattern.compile("\\(?\\b(\\d{1,2})\\s*de\\s*(\\d{1,2})\\b\\)?");
        // Pattern 3: parc 3 or parc. 3
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
            // total is unknown, default to 1 or p
            t = p;
            String cleanDesc = cleanDescription(desc, mat3.start(), mat3.end());
            return new InstallmentInfo(cleanDesc, p, t);
        }

        return new InstallmentInfo(desc, p, t);
    }

    private static String cleanDescription(String desc, int start, int end) {
        String clean = desc.substring(0, start) + " " + desc.substring(end);
        // Clean double spaces, hyphens, brackets, parenthesis
        return clean.replaceAll("\\(\\s*\\)", "")
                .replaceAll("\\[\\s*\\]", "")
                .replace("-  ", " ")
                .replace(" - ", " ")
                .replaceAll("\\s{2,}", " ")
                .trim();
    }
}
