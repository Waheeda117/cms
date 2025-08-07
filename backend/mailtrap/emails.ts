import {
	PASSWORD_RESET_REQUEST_TEMPLATE,
	PASSWORD_RESET_SUCCESS_TEMPLATE,
	VERIFICATION_EMAIL_TEMPLATE,
} from "./emailTemplates.js";
import { mailtrapClient, sender } from "./mailtrap.config.js";

export const sendVerificationEmail = async (email: string, verificationToken: string): Promise<void> => {
	const recipient = [{ email }];

	try {
		const response = await mailtrapClient.send({
			from: sender,
			to: recipient,
			subject: "Verify your email",
			html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
			category: "Email Verification",
		});

		console.log("Email sent successfully", response);
	} catch (error) {
		console.error(`Error sending verification`, error);
		const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
		throw new Error(`Error sending verification email: ${errorMessage}`);
	}
};

export const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
	const recipient = [{ email }];

	try {
		const response = await mailtrapClient.send({
			from: sender,
			to: recipient,
			template_uuid: "e65925d1-a9d1-4a40-ae7c-d92b37d593df",
			template_variables: {
				company_info_name: "Auth Company",
				name: name,
			},
		});

		console.log("Welcome email sent successfully", response);
	} catch (error) {
		console.error(`Error sending welcome email`, error);
		const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
		throw new Error(`Error sending welcome email: ${errorMessage}`);
	}
};

export const sendPasswordResetEmail = async (email: string, resetURL: string): Promise<void> => {
	const recipient = [{ email }];

	try {
		const response = await mailtrapClient.send({
			from: sender,
			to: recipient,
			subject: "Reset your password",
			html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
			category: "Password Reset",
		});
	} catch (error) {
		console.error(`Error sending password reset email`, error);
		const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
		throw new Error(`Error sending password reset email: ${errorMessage}`);
	}
};

export const sendResetSuccessEmail = async (email: string): Promise<void> => {
	const recipient = [{ email }];

	try {
		const response = await mailtrapClient.send({
			from: sender,
			to: recipient,
			subject: "Password Reset Successful",
			html: PASSWORD_RESET_SUCCESS_TEMPLATE,
			category: "Password Reset",
		});

		console.log("Password reset email sent successfully", response);
	} catch (error) {
		console.error(`Error sending password reset success email`, error);
		const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
		throw new Error(`Error sending password reset success email: ${errorMessage}`);
	}
}; 