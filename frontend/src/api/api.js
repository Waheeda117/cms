import axios from 'axios';

// Get the base URL depending on the environment (development or production)
const API_URL = import.meta.env.MODE === 'development' 
  ? 'http://localhost:5000/api'   // Development URL
  : '/api';                        // Production URL (relative to the deployed server)

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Ensure cookies are sent with requests
});

// API call to register a doctor
export const registerDoctor = async (userData) => {
  try {
    const response = await axiosInstance.post('/admin/register/doctor', userData);
    return response.data; // Return the API response data
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// API call to register a receptionist
export const registerReceptionist = async (userData) => {
  try {
    const response = await axiosInstance.post('/admin/register/receptionist', userData);
    return response.data; // Return the API response data
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// API call to register a pharmacist dispenser
export const registerPharmacistDispenser = async (userData) => {
  try {
    const response = await axiosInstance.post('/admin/register/pharmacist-dispenser', userData);
    return response.data; // Return the API response data
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// API call to register a pharmacist inventory
export const registerPharmacistInventory = async (userData) => {
  try {
    const response = await axiosInstance.post('/admin/register/pharmacist-inventory', userData);
    return response.data; // Return the API response data
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// API call to get all user data
export const getUsersData = async () => {
  try {
    const response = await axiosInstance.get('/admin/get-users-data');
    return response.data; // Return the API response data
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// API call to update the password
export const updatePassword = async (userData) => {
  try {
    const response = await axiosInstance.post('/auth/update-password', userData);
    return response.data; // Return the API response data
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const resetUserPassword = async (userId) => {
  try {
    const response = await axiosInstance.post('/auth/reset-password', {
      userId: userId
    });
    return response.data;
  } catch (error) {
    console.error('Reset Password API Error:', error);
    throw error;
  }
};

export const getUserDataByRoleAndId = async (role, id) => {
  try {
    const response = await axiosInstance.get(`/admin/${role}/${id}`);
    return response.data; // Return the API response data
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const updateUserDataByRoleAndId = async (role, id, userData) => {
  try {
    const response = await axiosInstance.patch(`/admin/${role}/${id}`, userData);
    return response.data; // Return the API response data
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};


// API call to update user account status by role and ID
export const updateUserAccountStatus = async (role, id, statusData) => {
  try {
    const response = await axiosInstance.patch(`/admin/${role}/${id}/`, statusData);
    return response.data; // Return the API response data
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const deleteUserByRoleAndId = async (role, id) => {
  try {
    const response = await axiosInstance.delete(`/admin/${role}/${id}`);
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const addToStock = async (stockData) => {
  try {
    const response = await axiosInstance.post('/inventory/add-batch', stockData);
    return response.data;
  } catch (error) {
    console.error('Error adding stock:', error);
    throw error;
  }
};


export const getStocksData = async (page = 1, limit = 50, search = "") => {
  try {
    const response = await axiosInstance.get('/inventory/batches', {
      params: {
        page,
        limit,
        search
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching stock data:', error);
    throw error;
  }
};

export const getAllStocksData = async (page = 1, limit = 50, search = '', sortBy = 'medicineName', sortOrder = 'asc') => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      sortBy,
      sortOrder
    });

    const response = await axiosInstance.get(`/inventory/all-medicines?${params}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching all stocks data:', error);
    throw error;
  }
};


export const deleteStockById = async (stockId) => {
  try {
    const response = await axiosInstance.delete(`/inventory/batch/${stockId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting stock:', error);
    throw error;
  }
};

// Get batch by ID
export const getBatchById = async (batchId) => {
  try {
    const response = await axiosInstance.get(`/inventory/batch/${batchId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching batch:", error);
    throw error;
  }
};

// Get stock by medicine name
export const getStockById = async (medicineName) => {
  try {
    // Encode the medicine name to handle special characters and spaces
    const encodedMedicineName = encodeURIComponent(medicineName);

    const response = await axiosInstance.get(
      `/inventory/stock/${encodedMedicineName}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching stock by medicine name:", error);
    throw error;
  }
};

// Update batch by ID
export const updateBatchById = async (batchId, updateData) => {
  try {
    const response = await axiosInstance.put(`/inventory/batch/${batchId}`, updateData);
    return response.data;
  } catch (error) {
    console.error("Error updating batch:", error);
    throw error;
  }
};

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axiosInstance.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.url;
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
};

export const addDraftBatch = async (draftData) => {
  try {
    const response = await axiosInstance.post('/inventory/add-draft-batch', draftData);
    return response.data;
  } catch (error) {
    console.error('Error saving draft batch:', error);
    throw error;
  }
};

export const finalizeBatch = async (batchId) => {
  try {
    const response = await axiosInstance.put(`/inventory/finalize-batch/${batchId}`);
    return response.data;
  } catch (error) {
    console.error('Error finalizing batch:', error);
    throw error;
  }
};

export const getDashboardStats = async (dateRange = 'this_month') => {
  try {
    const response = await axiosInstance.get(`/inventory/dashboard-stats?dateRange=${dateRange}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};