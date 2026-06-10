import java.math.BigDecimal;
public class test_parse {
    public static void main(String[] args) {
        String valorStr = "19.99";
        valorStr = valorStr.replaceAll("[^0-9.,-]", "");
        int lastComma = valorStr.lastIndexOf(',');
        int lastDot = valorStr.lastIndexOf('.');
        if (lastComma > lastDot) {
            valorStr = valorStr.replace(".", "").replace(",", ".");
        } else if (lastDot > lastComma) {
            valorStr = valorStr.replace(",", "");
        } else if (lastComma != -1) {
            valorStr = valorStr.replace(",", ".");
        }
        System.out.println("Result for 19.99: " + new BigDecimal(valorStr));
        
        valorStr = "19,99";
        valorStr = valorStr.replaceAll("[^0-9.,-]", "");
        lastComma = valorStr.lastIndexOf(',');
        lastDot = valorStr.lastIndexOf('.');
        if (lastComma > lastDot) {
            valorStr = valorStr.replace(".", "").replace(",", ".");
        } else if (lastDot > lastComma) {
            valorStr = valorStr.replace(",", "");
        } else if (lastComma != -1) {
            valorStr = valorStr.replace(",", ".");
        }
        System.out.println("Result for 19,99: " + new BigDecimal(valorStr));
        
        String csvLine = "01/03/2026,COMPRA,\"19,99\"";
        String[] split = csvLine.split("[,;]");
        System.out.println("Split length: " + split.length);
        for(String s : split) System.out.println("Part: " + s);
    }
}