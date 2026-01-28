//! Email service using Resend API
//! Simple, secure email delivery for password reset flows

use crate::config::Config;
use serde_json::json;
use tracing::{error, warn};

#[derive(Clone)]
pub struct EmailService {
    api_key: Option<String>,
    from_email: String,
    from_name: String,
    frontend_base_url: String,
}

impl EmailService {
    pub fn new(config: &Config) -> Self {
        Self {
            api_key: config.resend_api_key.clone(),
            from_email: config.resend_from_email.clone(),
            from_name: config.resend_from_name.clone(),
            frontend_base_url: config.frontend_base_url.clone(),
        }
    }

    pub fn is_configured(&self) -> bool {
        self.api_key.is_some()
    }

    /// Send password reset email
    /// Returns Ok(()) on success, Err on failure
    /// Failures are logged but don't expose user existence
    pub async fn send_password_reset(&self, email: &str, token: &str) -> Result<(), String> {
        if !self.is_configured() {
            warn!("Resend API key not configured. Skipping password reset email.");
            return Err("Email service not configured".to_string());
        }

        let reset_url = format!("{}/reset-password?token={}", self.frontend_base_url, token);
        
        // Simple text-first email template
        let subject = "Reset Your Password";
        let text_body = format!(
            "You requested a password reset for your Rails account.\n\n\
            Click the link below to reset your password:\n\n\
            {}\n\n\
            This link will expire in 1 hour.\n\n\
            If you didn't request this, you can safely ignore this email.\n\n\
            — Rails Financial Infrastructure",
            reset_url
        );
        
        let html_body = format!(
            "<!DOCTYPE html>\n\
            <html>\n\
            <head><meta charset=\"utf-8\"></head>\n\
            <body style=\"font-family: system-ui, sans-serif; line-height: 1.6; color: #333;\">\n\
            <p>You requested a password reset for your Rails account.</p>\n\
            <p><a href=\"{}\" style=\"display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;\">Reset Password</a></p>\n\
            <p style=\"font-size: 14px; color: #666;\">This link will expire in 1 hour.</p>\n\
            <p style=\"font-size: 14px; color: #666;\">If you didn't request this, you can safely ignore this email.</p>\n\
            <hr style=\"border: none; border-top: 1px solid #eee; margin: 24px 0;\">\n\
            <p style=\"font-size: 12px; color: #999;\">— Rails Financial Infrastructure</p>\n\
            </body>\n\
            </html>",
            reset_url
        );

        let client = reqwest::Client::new();
        let api_key = self.api_key.as_ref().unwrap();

        let payload = json!({
            "from": format!("{} <{}>", self.from_name, self.from_email),
            "to": [email],
            "subject": subject,
            "text": text_body,
            "html": html_body,
        });

        match client
            .post("https://api.resend.com/emails")
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await
        {
            Ok(response) => {
                if response.status().is_success() {
                    tracing::info!("Password reset email sent successfully to {}", email);
                    Ok(())
                } else {
                    let status = response.status();
                    let error_text = response.text().await.unwrap_or_default();
                    error!(
                        "Resend API error: status={}, response={}",
                        status, error_text
                    );
                    Err(format!("Failed to send email: {}", status))
                }
            }
            Err(e) => {
                error!("Failed to send password reset email: {}", e);
                Err(format!("Network error: {}", e))
            }
        }
    }
}
