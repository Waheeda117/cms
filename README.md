# Patient Management System

A full‑stack monorepo application for comprehensive healthcare management. This project provides an integrated management solution covering inventory management, user management (doctors, receptionists, pharmacists), patient registration, appointments and more.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Setup & Installation](#setup--installation)
- [Running the Project](#running-the-project)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)

## Overview

This project is a monorepo, separating concerns between the backend (server-side logic, API endpoints, database models, email integrations) and the frontend (React application with modern tooling). The system manages:
- User authentication and role-based authorization
- Inventory & batch management for medicines and supplies
- Patient registration, appointments, and prescriptions
- Dashboard and analytics for healthcare management
- Email notifications using Mailtrap

## Features

- **User Management**: Roles include admin, doctor, receptionist, pharmacist (dispenser & inventory).
- **Inventory Management**: Handle stock entries, draft batches, finalizations, and report low stock or expiring medicines.
- **Patient Management**: Register and manage patient data, medical histories, and appointments.
- **Responsive UI**: Frontend built with React, Vite, Tailwind CSS, and Zustand for state management.
- **Real-Time Updates**: Utilizes modern React libraries like Framer Motion for animations and dynamic UI feedback.
- **Deployment Ready**: Configured for deployment on Vercel with separate build settings for backend and frontend.

## Project Structure

Below is the high-level structure of the project:

📁 Project Structure

project-root/
├── 📄 .env                    # Environment variables
├── 📄 .gitignore             # Git ignore rules
├── 📄 LICENSE                # Project license
├── 📄 package.json           # Root configuration and scripts
├── 📄 README.md              # Project documentation
├── 📄 vercel.json            # Vercel deployment configuration
├── 📂 backend/               # Backend application
├── 📂 frontend/              # Frontend application
└── 📂 uploads/               # Uploaded files storage

🗄️ Backend (/backend/)
backend/
├── 📄 index.js               # Server entry point
├── 📂 config/               # Configuration files
├── 📂 controllers/          # API endpoint logic
│   ├── 📄 admin.controller.js
│   ├── 📄 auth.controller.js
│   ├── 📄 inventory.controller.js
│   └── 📄 ...other controllers
├── 📂 db/                   # Database connection and seed data
├── 📂 middleware/           # Express middleware (auth, error handling)
├── 📂 models/               # Mongoose models (User, Inventory, Prescription)
├── 📂 routes/               # API routes (auth, admin, inventory, patient, upload)
└── 📂 utils/                # Utility functions and helpers


🎨 Frontend (/frontend/)
frontend/
├── 📄 index.html            # HTML entry point
├── 📄 package.json          # Frontend dependencies and scripts
├── 📄 postcss.config.js     # PostCSS configuration
├── 📄 README.md             # Frontend documentation
├── 📄 tailwind.config.js    # Tailwind CSS configuration
├── 📄 vite.config.js        # Vite build configuration
├── 📂 public/               # Static assets
└── 📂 src/                  # React application source
    ├── 📂 components/       # Reusable UI components (Sidebar, Dashboard)
    ├── 📂 hooks/            # Custom React hooks
    ├── 📂 pages/            # Page components (Login, Dashboard, Inventory)
    ├── 📂 store/            # Zustand state management (authStore, addBatchStore)
    └── 📂 api/              # API services for backend interaction


📋 Key Features

🔐 Authentication System - Secure login/logout with JWT
👥 Role-Based Access - Admin and user permissions
📦 Inventory Management - Track and manage inventory items
💊 Prescription Management - Handle medical prescriptions
📱 Responsive Design - Mobile-friendly interface
☁️ Cloud Storage - Cloudinary integration for file uploads
🚀 Modern Stack - Latest React, Node.js, and MongoDB



## Tech Stack

- **Backend**
  - **Node.js / Express** – Server framework for building REST APIs.
  - **MongoDB & Mongoose** – Database for persistent storage and ODM for schema definitions.
  - **bcryptjs** – Password hashing.
  - **jsonwebtoken** – For authentication tokens.
  - **Mailtrap** – For handling email notifications.
  - **Multer** – For file upload management.
  
- **Frontend**
  - **React** – UI library for building user interfaces.
  - **Vite** – Fast bundler and development server.
  - **Tailwind CSS** – Utility-first CSS framework.
  - **Zustand** – Lightweight state management for React.
  - **Framer Motion** – For animations and motion designs.
  - **Axios** – For making HTTP requests to the backend.
  

## Setup & Installation

1. **Clone the Repository**

   ```sh
   git clone <https://github.com/Waheeda117/cms/>
   cd cms


2. **Setup Environment Variables**

Create a .env file in the root of the project with your configuration variables (for example, database URL, port, frontend URL, etc.):

# Example .env file
PORT=5000
MONGODB_URI=mongodb://localhost:27017/patient_management
JWT_SECRET=your_jwt_secret
MAILTRAP_ENDPOINT=https://mailtrap.io/api/send
MAILTRAP_TOKEN=your_mailtrap_token
FRONTEND_URL=http://localhost:5173

3. **Install Dependencies**
Backend Dependencies:

npm install

Frontend Dependencies:
cd frontend
npm install


3. **Running the Project**
Development Mode
Backend
Run the backend server with nodemon for live-reloading:

npm run dev

Frontend
In a separate terminal, run the frontend development server:

cd frontend
npm run dev

The frontend will typically be available at http://localhost:5173 and the backend API at http://localhost:5000



Contributing
Contributions are welcome! Please follow these steps:

Clone the repository.
Create a new branch for your feature or bug fix.
Ensure your code and commits follow the project coding standards.
Submit a pull request detailing your changes.