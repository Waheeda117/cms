import { create } from "zustand";
import axios from "axios";

const API_URL = import.meta.env.MODE === "development" ? "http://localhost:5000/api/auth" : "/api/auth";

axios.defaults.withCredentials = true;

export const useAuthStore = create((set) => ({
	user: null,
	isAuthenticated: false,
	error: null,
	isLoading: false,
	isCheckingAuth: true,
	message: null,

	// Helper function to generate username
	generateUsername: (firstName, lastName) => {
		if (!firstName || !lastName) return '';
		
		// Get first letter of firstName and full lastName, convert to lowercase
		const username = (firstName.charAt(0) + lastName).toLowerCase();
		return username;
	},

	// Function to check if username exists and get available username
	checkUsernameAvailability: async (firstName, lastName) => {
		try {
			const baseUsername = (firstName.charAt(0) + lastName).toLowerCase();
			const response = await axios.post(`${API_URL}/check-username`, { username: baseUsername });
			return response.data.availableUsername; // Backend will return available username (baseUsername, baseUsername1, etc.)
		} catch (error) {
			console.error('Error checking username availability:', error);
			return null;
		}
	},

	signup: async (firstName, lastName, username, email, cnic, password, role) => {
		set({ isLoading: true, error: null });
		try {
			const response = await axios.post(`${API_URL}/signup`, { 
				firstName, 
				lastName, 
				username, 
				email: email || undefined, // Send undefined if email is empty
				cnic: cnic || undefined,   // Send undefined if cnic is empty
				password, 
				role 
			});
			set({ user: response.data.user, isAuthenticated: true, isLoading: false });
		} catch (error) {
			set({ error: error.response.data.message || "Error signing up", isLoading: false });
			throw error;
		}
	},
	
	login: async (username, password) => {
		set({ isLoading: true, error: null });
		try {
			const response = await axios.post(`${API_URL}/login`, { username, password });
			set({
				isAuthenticated: true,
				user: response.data.user,
				error: null,
				isLoading: false,
			});
		} catch (error) {
			set({ error: error.response?.data?.message || "Error logging in", isLoading: false });
			throw error;
		}
	},

	logout: async () => {
		set({ isLoading: true, error: null });
		try {
			await axios.post(`${API_URL}/logout`);
			set({ user: null, isAuthenticated: false, error: null, isLoading: false });
		} catch (error) {
			set({ error: "Error logging out", isLoading: false });
			throw error;
		}
	},

	checkAuth: async () => {
		set({ isCheckingAuth: true, error: null });
		try {
			const response = await axios.get(`${API_URL}/check-auth`);
			set({ user: response.data.user, isAuthenticated: true, isCheckingAuth: false });
		} catch (error) {
			set({ error: null, isCheckingAuth: false, isAuthenticated: false });
		}
	},
}));