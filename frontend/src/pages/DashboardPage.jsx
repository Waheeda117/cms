// Dashboard.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../hooks/useTheme";
import {
  Users,
  UserPlus,
  Stethoscope,
  Calendar,
  Pill,
  ClipboardList,
  Activity,
  BarChart3,
  Bell,
  Package,
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  HeartPulse,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";
import SummaryCard from "../components/dashboard/SummaryCard";
import LineChartComponent from "../components/dashboard/LineChartComponent";
import BarChart from "../components/dashboard/BarChartComponent";
import PieChartComponent from "../components/dashboard/PieChartComponent";
import RecentAppointments from "../components/dashboard/RecentAppointments";
import LowStockAlerts from "../components/dashboard/LowStockAlerts";
import RecentUsers from "../components/dashboard/RecentUsers";
import PatientVisitsTrend from "../components/dashboard/PatientVisitsTrend";
import PrescriptionStatus from "../components/dashboard/PrescriptionStatus";
import RevenueOverview from "../components/dashboard/RevenueOverview";
import DoctorAvailability from "../components/dashboard/DoctorAvailability";
import UpcomingAppointments from "../components/dashboard/UpcomingAppointments";

const DashboardPage = () => {
  const { theme } = useTheme();
  const [dateRange, setDateRange] = useState("this_week");

  // Summary cards data
  const summaryCards = [
    {
      title: "Total Patients",
      value: 1425,
      icon: Users,
      change: "+12.5%",
      color: "text-blue-500",
      bgColor: "bg-blue-500 bg-opacity-20 border-blue-500",
    },
    {
      title: "Today's Appointments",
      value: 28,
      icon: Calendar,
      change: "+3",
      color: "text-purple-500",
      bgColor: "bg-purple-500 bg-opacity-20 border-purple-500",
    },
    {
      title: "Active Staff",
      value: 24,
      icon: Stethoscope,
      change: "+2",
      color: "text-green-500",
      bgColor: "bg-green-500 bg-opacity-20 border-green-500",
    },
    {
      title: "Pending Prescription",
      value: 18,
      icon: ClipboardList,
      change: "-5",
      color: "text-orange-500",
      bgColor: "bg-orange-500 bg-opacity-20 border-orange-500",
    },
  ];

  // Appointment stats data
  const appointmentStats = {
    scheduled: 245,
    completed: 218,
    canceled: 27,
    noShow: 12,
  };

  // Inventory stats
  const inventoryStats = {
    totalItems: 342,
    lowStock: 28,
    nearExpiry: 14,
    outOfStock: 5,
  };

  // Dummy data for charts
  const appointmentData = [
    { day: "Mon", appointments: 32 },
    { day: "Tue", appointments: 28 },
    { day: "Wed", appointments: 41 },
    { day: "Thu", appointments: 35 },
    { day: "Fri", appointments: 48 },
    { day: "Sat", appointments: 22 },
    { day: "Sun", appointments: 12 },
  ];

  const patientData = [
    { name: "New Patients", value: 142 },
    { name: "Returning Patients", value: 287 },
    { name: "Follow-ups", value: 98 },
  ];

  const prescriptionData = [
    { medicine: "Paracetamol", count: 142 },
    { medicine: "Amoxicillin", count: 98 },
    { medicine: "Omeprazole", count: 76 },
    { medicine: "Atorvastatin", count: 65 },
    { medicine: "Metformin", count: 54 },
  ];

  return (
    <div className="p-6">
      {/* Page Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-5 justify-between items-start">
          <div>
            <h1 className={`text-3xl font-bold ${theme.textPrimary} mb-1`}>
              Clinic Dashboard
            </h1>
            <p className={`${theme.textMuted}`}>
              Overview of clinic operations and performance metrics
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              className={`px-3 py-1.5 text-sm rounded-lg ${theme.cardSecondary} ${theme.border} border ${theme.textSecondary}`}
            >
              Today
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-lg ${theme.cardSecondary} ${theme.border} border ${theme.textSecondary}`}
            >
              This Week
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-lg ${
                dateRange === "this_month"
                  ? "bg-emerald-500 text-white"
                  : theme.cardSecondary
              } ${theme.border} border ${theme.textPrimary}`}
            >
              This Month
            </button>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6"
      >
        {summaryCards.map((card, index) => (
          <SummaryCard key={index} card={card} theme={theme} />
        ))}
      </motion.div>

      {/* Charts and Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Appointments Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className={`lg:col-span-2 p-6 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-1`}>
                Appointments Overview
              </h2>
              <p className={`text-sm ${theme.textMuted}`}>
                Weekly appointment trends
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
                <span className={`text-xs ${theme.textSecondary}`}>
                  Scheduled
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span className={`text-xs ${theme.textSecondary}`}>
                  Completed
                </span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <LineChartComponent data={appointmentData} theme={theme} />
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="space-y-6">
          {/* Appointment Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`p-6 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>
                Appointment Stats
              </h3>
              <Calendar className={`w-5 h-5 ${theme.textMuted}`} />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className={`${theme.textSecondary}`}>Completed</span>
                </div>
                <div className="flex items-center">
                  <span className={`font-medium ${theme.textPrimary}`}>
                    {appointmentStats.completed}
                  </span>
                  <span className="text-xs text-green-500 ml-2">+12%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-blue-500 mr-2" />
                  <span className={`${theme.textSecondary}`}>Scheduled</span>
                </div>
                <span className={`font-medium ${theme.textPrimary}`}>
                  {appointmentStats.scheduled}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <XCircle className="w-4 h-4 text-red-500 mr-2" />
                  <span className={`${theme.textSecondary}`}>Canceled</span>
                </div>
                <span className={`font-medium ${theme.textPrimary}`}>
                  {appointmentStats.canceled}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <UserPlus className="w-4 h-4 text-orange-500 mr-2" />
                  <span className={`${theme.textSecondary}`}>No Show</span>
                </div>
                <span className={`font-medium ${theme.textPrimary}`}>
                  {appointmentStats.noShow}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Inventory Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`p-6 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>
                Inventory Overview
              </h3>
              <Package className={`w-5 h-5 ${theme.textMuted}`} />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className={`${theme.textSecondary}`}>Total Items</span>
                </div>
                <span className={`font-medium ${theme.textPrimary}`}>
                  {inventoryStats.totalItems}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                  <span className={`${theme.textSecondary}`}>Low Stock</span>
                </div>
                <div className="flex items-center">
                  <span className={`font-medium ${theme.textPrimary}`}>
                    {inventoryStats.lowStock}
                  </span>
                  <span className="text-xs text-red-500 ml-2">Attention</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                  <span className={`${theme.textSecondary}`}>Near Expiry</span>
                </div>
                <span className={`font-medium ${theme.textPrimary}`}>
                  {inventoryStats.nearExpiry}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <span className={`${theme.textSecondary}`}>Out of Stock</span>
                </div>
                <span className={`font-medium ${theme.textPrimary}`}>
                  {inventoryStats.outOfStock}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Second Row - Additional Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Patient Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`p-6 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-1`}>
                Patient Distribution
              </h2>
              <p className={`text-sm ${theme.textMuted}`}>
                New vs returning patients
              </p>
            </div>
            <Users className={`w-5 h-5 ${theme.textMuted}`} />
          </div>
          <div className="h-64 flex items-center justify-center">
            <PieChartComponent data={patientData} theme={theme} />
          </div>
        </motion.div>

        {/* Top Prescriptions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`p-6 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-1`}>
                Top Prescriptions
              </h2>
              <p className={`text-sm ${theme.textMuted}`}>
                Most prescribed medicines
              </p>
            </div>
            <Pill className={`w-5 h-5 ${theme.textMuted}`} />
          </div>
          <div className="h-64">
            <BarChart data={prescriptionData} theme={theme} />
          </div>
        </motion.div>

        {/* System Health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`p-6 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-1`}>
                System Health
              </h2>
              <p className={`text-sm ${theme.textMuted}`}>
                Performance and usage metrics
              </p>
            </div>
            <Activity className={`w-5 h-5 ${theme.textMuted}`} />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className={`text-sm ${theme.textSecondary}`}>
                  Server Uptime
                </span>
                <span className={`text-sm font-medium ${theme.textPrimary}`}>
                  99.98%
                </span>
              </div>
              <div className={`w-full h-2 ${theme.cardSecondary} rounded-full`}>
                <div
                  className="h-2 bg-green-500 rounded-full"
                  style={{ width: "99.98%" }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className={`text-sm ${theme.textSecondary}`}>
                  Database Usage
                </span>
                <span className={`text-sm font-medium ${theme.textPrimary}`}>
                  64%
                </span>
              </div>
              <div className={`w-full h-2 ${theme.cardSecondary} rounded-full`}>
                <div
                  className="h-2 bg-blue-500 rounded-full"
                  style={{ width: "64%" }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className={`text-sm ${theme.textSecondary}`}>
                  Active Sessions
                </span>
                <span className={`text-sm font-medium ${theme.textPrimary}`}>
                  42
                </span>
              </div>
              <div className={`w-full h-2 ${theme.cardSecondary} rounded-full`}>
                <div
                  className="h-2 bg-purple-500 rounded-full"
                  style={{ width: "70%" }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className={`text-sm ${theme.textSecondary}`}>
                  API Response Time
                </span>
                <span className={`text-sm font-medium ${theme.textPrimary}`}>
                  128ms
                </span>
              </div>
              <div className={`w-full h-2 ${theme.cardSecondary} rounded-full`}>
                <div
                  className="h-2 bg-yellow-500 rounded-full"
                  style={{ width: "85%" }}
                ></div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <PatientVisitsTrend theme={theme} />
        <PrescriptionStatus theme={theme} />
      </div>

      {/* Third Row - Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Appointments */}
        <RecentAppointments theme={theme} />

        {/* Low Stock Alerts */}
        <LowStockAlerts theme={theme} />
      </div>

      {/* Last Row - Recent Users */}
      <div className="mb-6">
        <RecentUsers theme={theme} />
      </div>

      <div className="mb-6">
        <RevenueOverview theme={theme} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <DoctorAvailability theme={theme} />
        <UpcomingAppointments theme={theme} />
      </div>
    </div>
  );
};

export default DashboardPage;
