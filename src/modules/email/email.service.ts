import nodemailer, { Transporter } from "nodemailer";
import nunjucks from "nunjucks";
import config from "../../config";

export class EmailService {
  private static transporter: Transporter | null = null;

  private static getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: config.APP_EMAIL,
          pass: config.APP_PASSWORD,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });
    }
    return this.transporter;
  }
  //   sendOTPEmail
  static async sendOTPEmail(
    email: string,
    name: string,
    otp: string,
    isResend: boolean = false,
  ): Promise<void> {
    const emailHTML = nunjucks.render("verify-otp-email.html", {
      name,
      otp,
      expiryMinutes: 15,
    });

    const mailOptions = {
      from: `"Quick Gari" <${config.APP_EMAIL}>`,
      to: email,
      subject: isResend
        ? "Resend OTP - Verify your email"
        : "Verify your email - OTP Code",
      html: emailHTML,
    };

    const transporter = this.getTransporter();
    await transporter.sendMail(mailOptions);
  }

  // Payment Success Email
  static async sendPaymentSuccessEmail(data: {
    email: string;
    name: string;
    planName: string;
    amount: number;
    transactionId: string;
    invoiceNumber: string;
    subscriptionEndDate: string;
    receiptUrl: string;
    invoiceUrl?: string;
  }): Promise<void> {
    const fullReceiptUrl = `${config.BASE_URL}${data.receiptUrl}`;
    const fullInvoiceUrl = data.invoiceUrl
      ? `${config.BASE_URL}${data.invoiceUrl}`
      : null;

    const emailHTML = nunjucks.render("payment-success-email.html", {
      name: data.name,
      planName: data.planName,
      amount: data.amount.toFixed(2),
      transactionId: data.transactionId,
      invoiceNumber: data.invoiceNumber,
      subscriptionEndDate: data.subscriptionEndDate,
      receiptUrl: fullReceiptUrl,
      invoiceUrl: fullInvoiceUrl,
      hasInvoice: !!fullInvoiceUrl,
      year: new Date().getFullYear(),
    });

    const mailOptions = {
      from: `"Quick Gari" <${config.APP_EMAIL}>`,
      to: data.email,
      subject: "Payment Successful - Subscription Activated",
      html: emailHTML,
    };

    const transporter = this.getTransporter();
    await transporter.sendMail(mailOptions);
  }

  //  Payment Failed Email
  static async sendPaymentFailedEmail(data: {
    email: string;
    name: string;
    planName: string;
    amount: number;
    transactionId: string;
    reason?: string;
  }): Promise<void> {
    const emailHTML = nunjucks.render("payment-failed-email.html", {
      name: data.name,
      planName: data.planName,
      amount: data.amount.toFixed(2),
      transactionId: data.transactionId,
      reason: data.reason || "Payment could not be processed",
      year: new Date().getFullYear(),
    });

    const mailOptions = {
      from: `"Quick Gari" <${config.APP_EMAIL}>`,
      to: data.email,
      subject: "Payment Failed - Please Try Again",
      html: emailHTML,
    };

    const transporter = this.getTransporter();
    await transporter.sendMail(mailOptions);
  }

  // Payment Timeout Email
  static async sendPaymentTimeoutEmail(data: {
    email: string;
    name: string;
    planName: string;
    transactionId: string;
  }): Promise<void> {
    const emailHTML = nunjucks.render("payment-timeout-email.html", {
      name: data.name,
      planName: data.planName,
      transactionId: data.transactionId,
      year: new Date().getFullYear(),
    });

    const mailOptions = {
      from: `"Quick Gari" <${config.APP_EMAIL}>`,
      to: data.email,
      subject: "Payment Session Expired",
      html: emailHTML,
    };

    const transporter = this.getTransporter();
    await transporter.sendMail(mailOptions);
  }
}
