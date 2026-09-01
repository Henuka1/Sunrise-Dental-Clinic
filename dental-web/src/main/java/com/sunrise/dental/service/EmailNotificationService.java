package com.sunrise.dental.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import com.sunrise.dental.model.Appointment;
import com.sunrise.dental.model.Bill;
import com.sunrise.dental.util.ValidationUtil;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Sends appointment confirmation emails through the Resend API.
 * The Resend API key is read from the RESEND_API_KEY environment variable,
 * falling back to a local .env file (for IDE development).
 * The key is never hard-coded or exposed to the frontend.
 */
public class EmailNotificationService {

    private static final Logger LOGGER = Logger.getLogger(EmailNotificationService.class.getName());


    /** Notification statuses. */
    public static final String SENT = "SENT";
    public static final String FAILED = "FAILED";
    public static final String NOT_AVAILABLE = "NOT_AVAILABLE"; // no API key configured
    public static final String NOT_SENT = "NOT_SENT";           // invalid/missing recipient email

    /** Single background worker — emails never block the HTTP response. */
    private final ExecutorService mailExecutor = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "email-notifier");
        t.setDaemon(true);
        return t;
    });

    /**
     * Fires the appointment confirmation email asynchronously.
     * Never throws — appointment creation must not fail because of email problems.
     */
    public void sendAppointmentConfirmationAsync(Appointment apt, String patientEmail) {
        mailExecutor.submit(() -> {
            try {
                String status = sendAppointmentConfirmation(apt, patientEmail);
                LOGGER.info("Email notification status for " + apt.getAppointmentNumber() + ": " + status);
            } catch (Exception e) {
                LOGGER.log(Level.SEVERE, "Unexpected error while sending appointment email for "
                        + apt.getAppointmentNumber(), e);
            }
        });
    }

    /**
     * Sends the confirmation email synchronously and returns a status code.
     */
    public String sendAppointmentConfirmation(Appointment apt, String patientEmail) {
        String apiKey = getResendApiKey();
        if (apiKey == null || apiKey.trim().isEmpty()) {
            LOGGER.severe("Email configuration error: RESEND_API_KEY is not set (environment variable or .env file). "
                    + "Appointment confirmation emails cannot be sent.");
            return NOT_AVAILABLE;
        }

        // Email validation
        if (patientEmail == null || patientEmail.trim().isEmpty()) {
            LOGGER.warning("No email address on record for patient " + apt.getPatientId()
                    + " (" + apt.getAppointmentNumber() + ") — skipping email notification.");
            return NOT_SENT;
        }
        String email = patientEmail.trim();
        if (!ValidationUtil.isValidEmail(email)) {
            LOGGER.warning("Invalid email format '" + maskEmail(email) + "' for appointment "
                    + apt.getAppointmentNumber() + " — skipping email notification.");
            return NOT_SENT;
        }

        String from = getEnvOrDotEnv("RESEND_FROM_EMAIL");
        if (from == null || from.trim().isEmpty()) {
            from = "Sunrise Dental Clinic <onboarding@resend.dev>";
        }

        try {
            Resend resend = new Resend(apiKey);
            CreateEmailOptions options = CreateEmailOptions.builder()
                    .from(from)
                    .to(email)
                    .subject("Appointment Confirmation - Sunrise Dental Clinic")
                    .html(buildConfirmationHtml(apt))
                    .build();
            CreateEmailResponse result = resend.emails().send(options);
            LOGGER.info("Confirmation email sent via Resend for appointment "
                    + apt.getAppointmentNumber() + " (emailId=" + result.getId() + ")");
            return SENT;
        } catch (ResendException e) {
            // Invalid API key, unverified domain, invalid recipient, rate limit, etc.
            LOGGER.log(Level.WARNING, "Resend API error while sending confirmation email for appointment "
                    + apt.getAppointmentNumber() + ": " + e.getMessage(), e);
            return FAILED;
        } catch (Exception e) {
            // Network failure / timeout / unexpected
            LOGGER.log(Level.WARNING, "Failed to send confirmation email for appointment "
                    + apt.getAppointmentNumber() + ": " + e.getMessage(), e);
            return FAILED;
        }
    }

    /**
     * Fires the payment receipt email asynchronously after a bill is marked PAID.
     * Never throws — payment update must not fail because of email problems.
     */
    public void sendBillReceiptAsync(Bill bill, String patientEmail) {
        mailExecutor.submit(() -> {
            try {
                String status = sendBillReceipt(bill, patientEmail);
                LOGGER.info("Receipt email status for bill " + bill.getBillNumber() + ": " + status);
            } catch (Exception e) {
                LOGGER.log(Level.SEVERE, "Unexpected error while sending receipt email for bill "
                        + bill.getBillNumber(), e);
            }
        });
    }

    /**
     * Sends the payment receipt email synchronously and returns a status code.
     */
    public String sendBillReceipt(Bill bill, String patientEmail) {
        String apiKey = getResendApiKey();
        if (apiKey == null || apiKey.trim().isEmpty()) {
            LOGGER.severe("Email configuration error: RESEND_API_KEY is not set — receipt email cannot be sent.");
            return NOT_AVAILABLE;
        }

        if (patientEmail == null || patientEmail.trim().isEmpty()) {
            LOGGER.warning("No email address on record for patient " + bill.getPatientName()
                    + " (" + bill.getBillNumber() + ") — skipping receipt email.");
            return NOT_SENT;
        }
        String email = patientEmail.trim();
        if (!ValidationUtil.isValidEmail(email)) {
            LOGGER.warning("Invalid email format '" + maskEmail(email) + "' for bill "
                    + bill.getBillNumber() + " — skipping receipt email.");
            return NOT_SENT;
        }

        String from = getEnvOrDotEnv("RESEND_FROM_EMAIL");
        if (from == null || from.trim().isEmpty()) {
            from = "Sunrise Dental Clinic <onboarding@resend.dev>";
        }

        try {
            Resend resend = new Resend(apiKey);
            CreateEmailOptions options = CreateEmailOptions.builder()
                    .from(from)
                    .to(email)
                    .subject("Payment Receipt - Sunrise Dental Clinic (" + bill.getBillNumber() + ")")
                    .html(buildReceiptHtml(bill))
                    .build();
            CreateEmailResponse result = resend.emails().send(options);
            LOGGER.info("Receipt email sent via Resend for bill "
                    + bill.getBillNumber() + " (emailId=" + result.getId() + ")");
            return SENT;
        } catch (ResendException e) {
            LOGGER.log(Level.WARNING, "Resend API error while sending receipt email for bill "
                    + bill.getBillNumber() + ": " + e.getMessage(), e);
            return FAILED;
        } catch (Exception e) {
            LOGGER.log(Level.WARNING, "Failed to send receipt email for bill "
                    + bill.getBillNumber() + ": " + e.getMessage(), e);
            return FAILED;
        }
    }

    /** Builds the HTML payment receipt email. All dynamic values are HTML-escaped. */
    private String buildReceiptHtml(Bill bill) {
        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html><html><body style=\"margin:0;padding:0;background-color:#f4f7f7;")
          .append("font-family:'Segoe UI',Helvetica,Arial,sans-serif;\">")
          .append("<div style=\"max-width:560px;margin:24px auto;background:#ffffff;border-radius:10px;")
          .append("overflow:hidden;border:1px solid #e2e8f0;\">")

          // Header
          .append("<div style=\"background-color:#0d9488;padding:28px 32px;text-align:center;\">")
          .append("<h1 style=\"color:#ffffff;margin:0;font-size:22px;letter-spacing:2px;\">")
          .append("SUNRISE DENTAL CLINIC</h1>")
          .append("<p style=\"color:#ccfbf1;margin:6px 0 0;font-size:13px;\">Payment Receipt</p></div>")

          // Body
          .append("<div style=\"padding:32px;\">")
          .append("<p style=\"font-size:15px;color:#1f2937;margin:0 0 8px;\">Dear ")
          .append(escapeHtml(bill.getPatientName())).append(",</p>")
          .append("<p style=\"font-size:15px;color:#1f2937;margin:0 0 24px;\">")
          .append("We have received your payment in full. Thank you!</p>")

          // Receipt details card
          .append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" ")
          .append("style=\"background-color:#f0fdfa;border-radius:8px;border:1px solid #99f6e4;\">")
          .append(detailRow("Receipt Number", bill.getBillNumber(), true))
          .append(detailRow("Appointment", bill.getAppointmentNumber(), false))
          .append(detailRow("Treatment", bill.getTreatmentName(), false));
        if (bill.getAdditionalTreatmentNames() != null && !bill.getAdditionalTreatmentNames().isEmpty()) {
            sb.append(detailRow("Additional Treatments", bill.getAdditionalTreatmentNames(), false));
        }
        sb.append(detailRow("Treatment Cost", formatMoney(bill.getTreatmentCost()), false));
        if (bill.getConsultationFee() > 0) {
            sb.append(detailRow("Consultation Fee", formatMoney(bill.getConsultationFee()), false));
        }
        if (bill.getAdditionalCharges() > 0) {
            sb.append(detailRow("Additional Charges", formatMoney(bill.getAdditionalCharges()), false));
        }
        if (bill.getDiscount() > 0) {
            sb.append(detailRow("Discount", "- " + formatMoney(bill.getDiscount()), false));
        }
        sb.append(detailRow("Amount Paid", formatMoney(bill.getTotalAmount()), true))
          .append(detailRow("Payment Method", bill.getPaymentMethod() == null ? "" : bill.getPaymentMethod(), false))
          .append("</table>")

          .append("<p style=\"font-size:14px;color:#374151;margin:24px 0 0;line-height:1.6;\">")
          .append("Please keep this email as your receipt. If you have any questions about this payment, ")
          .append("please contact Sunrise Dental Clinic.</p>")

          .append("<p style=\"font-size:14px;color:#1f2937;margin:24px 0 0;\">")
          .append("Thank you for choosing Sunrise Dental Clinic.</p>")
          .append("<p style=\"font-size:14px;color:#1f2937;margin:16px 0 0;\">")
          .append("Regards,<br><strong>Sunrise Dental Clinic</strong><br>Colombo</p>")
          .append("</div>")

          // Footer
          .append("<div style=\"background-color:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;\">")
          .append("<p style=\"color:#94a3b8;font-size:11px;margin:0;text-align:center;\">")
          .append("This is an automated message. Please do not reply directly to this email.</p></div>")

          .append("</div></body></html>");
        return sb.toString();
    }

    /** Formats a money amount as LKR. */
    private String formatMoney(double amount) {
        return String.format("LKR %,.2f", amount);
    }

    /** Builds the professional HTML confirmation email. All dynamic values are HTML-escaped. */
    private String buildConfirmationHtml(Appointment apt) {
        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html><html><body style=\"margin:0;padding:0;background-color:#f4f7f7;")
          .append("font-family:'Segoe UI',Helvetica,Arial,sans-serif;\">")
          .append("<div style=\"max-width:560px;margin:24px auto;background:#ffffff;border-radius:10px;")
          .append("overflow:hidden;border:1px solid #e2e8f0;\">")

          // Header
          .append("<div style=\"background-color:#0d9488;padding:28px 32px;text-align:center;\">")
          .append("<h1 style=\"color:#ffffff;margin:0;font-size:22px;letter-spacing:2px;\">")
          .append("SUNRISE DENTAL CLINIC</h1>")
          .append("<p style=\"color:#ccfbf1;margin:6px 0 0;font-size:13px;\">Caring for your smile</p></div>")

          // Body
          .append("<div style=\"padding:32px;\">")
          .append("<p style=\"font-size:15px;color:#1f2937;margin:0 0 8px;\">Dear ")
          .append(escapeHtml(apt.getPatientName())).append(",</p>")
          .append("<p style=\"font-size:15px;color:#1f2937;margin:0 0 24px;\">")
          .append("Your dental appointment has been successfully booked.</p>")

          // Details card
          .append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" ")
          .append("style=\"background-color:#f0fdfa;border-radius:8px;border:1px solid #99f6e4;\">")
          .append(detailRow("Appointment Number", apt.getAppointmentNumber(), true))
          .append(detailRow("Dentist", apt.getDentistName(), false))
          .append(detailRow("Treatment", apt.getTreatmentName(), false))
          .append(detailRow("Date", apt.getAppointmentDate(), false))
          .append(detailRow("Time", apt.getAppointmentTime(), false))
          .append("</table>")

          .append("<p style=\"font-size:14px;color:#374151;margin:24px 0 0;line-height:1.6;\">")
          .append("Please arrive at the clinic approximately <strong>10 minutes before</strong> your appointment.</p>")
          .append("<p style=\"font-size:14px;color:#374151;margin:12px 0 0;line-height:1.6;\">")
          .append("If you need to reschedule or cancel your appointment, please contact Sunrise Dental Clinic.</p>")
          .append("<p style=\"font-size:14px;color:#374151;margin:16px 0 0;\">")
          .append("Thank you for choosing Sunrise Dental Clinic.</p>")

          .append("<p style=\"font-size:14px;color:#1f2937;margin:24px 0 0;\">")
          .append("Regards,<br><strong>Sunrise Dental Clinic</strong><br>Colombo</p>")
          .append("</div>")

          // Footer
          .append("<div style=\"background-color:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;\">")
          .append("<p style=\"color:#94a3b8;font-size:11px;margin:0;text-align:center;\">")
          .append("This is an automated message. Please do not reply directly to this email.</p></div>")

          .append("</div></body></html>");
        return sb.toString();
    }

    private String detailRow(String label, String value, boolean highlight) {
        return "<tr>"
                + "<td style=\"padding:10px 20px;color:#0f766e;font-size:13px;font-weight:600;width:180px;\">"
                + escapeHtml(label) + "</td>"
                + "<td style=\"padding:10px 20px;color:#111827;font-size:14px;"
                + (highlight ? "font-weight:700;" : "") + "\">" + escapeHtml(value) + "</td>"
                + "</tr>";
    }

    /** Escapes dynamic content to prevent HTML injection in emails. */
    private String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;").replace("<", "&lt;")
                .replace(">", "&gt;").replace("\"", "&quot;");
    }

    /** Never log the full recipient or any secrets. */
    private String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 0) return "***";
        return email.charAt(0) + "***" + email.substring(at);
    }

    /** Order: real environment variable -> GlassFish JVM property (-D...) -> local .env file. */
    private String getEnvOrDotEnv(String key) {
        String value = System.getenv(key);
        if (value == null || value.trim().isEmpty()) {
            value = System.getProperty(key);
        }
        if (value != null && !value.trim().isEmpty()) {
            return value;
        }
        Map<String, String> dotEnv = loadDotEnv();
        return dotEnv.get(key);
    }

    private String getResendApiKey() {
        return getEnvOrDotEnv("RESEND_API_KEY");
    }

    /**
     * Loads KEY=VALUE pairs from a .env file, searching common project locations
     * (working directory and its sub/parent folders). Values are never logged.
     */
    private Map<String, String> loadDotEnv() {
        Map<String, String> vars = new HashMap<>();

        Path currentDir = Paths.get(
                System.getProperty("user.dir", ".")
        ).toAbsolutePath();

        // Search current directory and parent directories
        for (int i = 0; i <= 10 && currentDir != null; i++) {

            Path envFile = currentDir.resolve(".env");

            if (Files.isRegularFile(envFile)) {
                try (InputStream in = Files.newInputStream(envFile)) {

                    byte[] bytes = in.readAllBytes();

                    for (String line : new String(
                            bytes,
                            java.nio.charset.StandardCharsets.UTF_8
                    ).split("\\r?\\n")) {

                        String trimmed = line.trim();

                        if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                            continue;
                        }

                        int eq = trimmed.indexOf('=');

                        if (eq <= 0) {
                            continue;
                        }

                        String key = trimmed.substring(0, eq).trim();
                        String value = trimmed.substring(eq + 1).trim();

                        // Remove surrounding quotes
                        if (value.length() >= 2 &&
                                ((value.startsWith("\"") && value.endsWith("\"")) ||
                                 (value.startsWith("'") && value.endsWith("'")))) {

                            value = value.substring(1, value.length() - 1);
                        }

                        if (!key.isEmpty()) {
                            vars.put(key, value);
                        }
                    }

                    LOGGER.info("Loaded email configuration from .env file");

                    return vars;

                } catch (IOException e) {

                    LOGGER.warning(
                            "Could not read .env file: " + e.getMessage()
                    );
                }
            }

            currentDir = currentDir.getParent();
        }

        // Fallback: .env bundled on the webapp classpath (src/main/resources/.env)
        try (InputStream in = EmailNotificationService.class.getResourceAsStream("/.env")) {
            if (in != null) {
                for (String line : new String(in.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8).split("\\r?\\n")) {
                    String trimmed = line.trim();
                    if (trimmed.isEmpty() || trimmed.startsWith("#")) continue;
                    int eq = trimmed.indexOf('=');
                    if (eq <= 0) continue;
                    String k = trimmed.substring(0, eq).trim();
                    String v = trimmed.substring(eq + 1).trim();
                    if (v.length() >= 2 && ((v.startsWith("\"") && v.endsWith("\"")) || (v.startsWith("'") && v.endsWith("'")))) {
                        v = v.substring(1, v.length() - 1);
                    }
                    if (!k.isEmpty()) vars.put(k, v);
                }
                if (!vars.isEmpty()) {
                    LOGGER.info("Loaded email configuration from classpath .env");
                }
            }
        } catch (IOException e) {
            LOGGER.warning("Could not read classpath .env: " + e.getMessage());
        }

        return vars;
    }
}


