export const getVerificationEmailHtml = (verificationUrl: string, fullName: string) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #333333;">Welcome to SmartBrief, ${fullName}! 👋</h2>
      <p style="color: #555555; font-size: 16px;">
        Thank you for signing up. Please verify your email address to unlock full access to your account and workspace.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
          Verify Email Address
        </a>
      </div>
      <p style="color: #777777; font-size: 14px;">
        Or copy and paste this link in your browser:<br>
        <a href="${verificationUrl}" style="color: #0070f3;">${verificationUrl}</a>
      </p>
      <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
      <p style="color: #999999; font-size: 12px;">This link will expire in 24 hours. If you did not create an account, please ignore this email.</p>
    </div>
  `;
};