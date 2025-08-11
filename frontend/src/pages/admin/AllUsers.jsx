import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { 
  Users, 
  UserPlus, 
  Stethoscope, 
  UserCheck, 
  Package, 
  Pill,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { getUsersData } from '../../api/api';
import UserRegistrationModal from '../../components/admin/UserRegistrationModal'; // Import the modal
import DeleteConfirmationModal from '../../components/admin/DeleteConfirmationModal';

const AllUsers = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('doctor');
  const [searchTerm, setSearchTerm] = useState('');
  const [usersData, setUsersData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');

    // Delete modal states - ADD THESE
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

    const handleNameClick = (user) => {
    navigate(`/admin/user-management/${user.role}/${user._id}`);
  };

  // Fetch users data from the API
  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getUsersData();
      setUsersData(data);
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle opening the modal
  const handleAddUser = (role) => {
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  //a/a/// auto updated
 const handleRegistrationSuccess = (createdUser) => {
  // modal close
  setIsModalOpen(false);

  // optional: jis role ka user add hua hai us tab par switch
  if (createdUser?.role && createdUser.role !== activeTab) {
    setActiveTab(createdUser.role);
  }

  // refetch so list updates without page refresh
  fetchData();
  };

    // ADD THESE DELETE HANDLERS
  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

    const handleDeleteSuccess = () => {
    // Refresh the data after successful deletion
    fetchData();
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  // If loading, return loading spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Handle error
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className={`text-center p-8 ${theme.cardOpacity} rounded-xl`}>
          <p className={`text-xl ${theme.textPrimary} mb-4`}>{error}</p>
          <button 
            onClick={fetchData}
            className={`px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white rounded-lg`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate summary statistics from the real data
  const totalUsers = usersData?.quickSummary?.totalUsers || 0;
  const activeUsers = usersData?.users?.filter(user => user.isActive).length || 0;
  const doctorCount = usersData?.roles?.doctor || 0;
  const receptionistCount = usersData?.roles?.receptionist || 0;
  const dispenserCount = usersData?.roles?.pharmacist_dispenser || 0;
  const inventoryCount = usersData?.roles?.pharmacist_inventory || 0;

  const tabs = [
    { id: 'doctor', label: 'Doctors', icon: Stethoscope, count: doctorCount },
    { id: 'receptionist', label: 'Receptionists', icon: UserCheck, count: receptionistCount },
    { id: 'pharmacist_dispenser', label: 'Dispensers', icon: Pill, count: dispenserCount },
    { id: 'pharmacist_inventory', label: 'Inventory', icon: Package, count: inventoryCount }
  ];

  const summaryCards = [
    {
      title: 'Total Users',
      value: totalUsers,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500 bg-opacity-20 border-blue-500'
    },
    {
      title: 'Active Users',
      value: activeUsers,
      icon: UserCheck,
      color: 'text-green-500',
      bgColor: 'bg-green-500 bg-opacity-20 border-green-500'
    },
    {
      title: 'Doctors',
      value: doctorCount,
      icon: Stethoscope,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500 bg-opacity-20 border-purple-500'
    },
    {
      title: 'Staff Members',
      value: receptionistCount + dispenserCount + inventoryCount,
      icon: Users,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500 bg-opacity-20 border-orange-500'
    }
  ];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTabTitle = (tabId) => {
    const tabTitles = {
      doctor: { title: 'Medical Doctors', subtitle: 'Manage registered doctors and their specializations' },
      receptionist: { title: 'Reception Staff', subtitle: 'Manage front desk and patient service staff' },
      pharmacist_dispenser: { title: 'Pharmacy Dispensers', subtitle: 'Manage medication dispensing staff' },
      pharmacist_inventory: { title: 'Inventory Pharmacists', subtitle: 'Manage pharmacy inventory and stock control staff' }
    };
    return tabTitles[tabId];
  };

  const getAddButtonText = (tabId) => {
    const addTexts = {
      doctor: 'Add Doctor',
      receptionist: 'Add Receptionist',
      pharmacist_dispenser: 'Add Dispenser',
      pharmacist_inventory: 'Add Inventory Staff'
    };
    return addTexts[tabId] || 'Add User';
  };

  const renderTableHeader = (tabId) => {
    const commonHeaders = ['Name', 'Gender', 'Phone', 'Status', 'Last Login', 'Actions'];
    
    if (tabId === 'doctor') {
      return ['Name', 'Gender', 'Speciality', 'Registration', 'Schedule', 'Status', 'Actions'];
    }
    
    return commonHeaders;
  };

  const renderTableRow = (user, tabId) => {
    if (tabId === 'doctor') {
      return (
        <tr key={user._id} className={`${theme.borderSecondary} border-b hover:bg-opacity-50 ${theme.cardSecondary} transition-colors`}>
          <td className="px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full ${theme.cardSecondary} flex items-center justify-center`}>
                <Stethoscope className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <div 
                  className={`font-medium ${theme.textPrimary} cursor-pointer hover:text-emerald-500 transition-colors`}
                  onClick={() => handleNameClick(user)}
                >
                  {user.firstName} {user.lastName}
                </div>
                <div className={`text-sm ${theme.textMuted}`}>@{user.username}</div>
              </div>
            </div>
          </td>
          <td className={`px-6 py-4 text-sm ${theme.textSecondary}`}>{user.gender}</td>
          <td className={`px-6 py-4 text-sm min-w-48 ${theme.textSecondary}`}>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              {user.speciality}
            </span>
          </td>
          <td className={`px-6 py-4 text-sm ${theme.textSecondary}`}>{user.registrationNumber}</td>
          <td className={`px-6 py-4 text-sm ${theme.textSecondary}`}>
            <div className="flex flex-wrap gap-1">
              {user.doctorSchedule?.slice(0, 2).map((day) => (
                <span key={day} className="px-1 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {day.slice(0, 3)}
                </span>
              ))}
              {user.doctorSchedule?.length > 2 && (
                <span className="px-1 py-0.5 rounded text-xs bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  +{user.doctorSchedule.length - 2}
                </span>
              )}
            </div>
          </td>
          <td className="px-6 py-4 ">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              user.isActive 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {user.isActive ? 'Active' : 'Inactive'}
            </span>
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => handleNameClick(user)}
                className={`p-1 rounded-lg ${theme.cardSecondary} hover:bg-opacity-70 transition-colors`}
              >
                <Eye className="w-4 h-4 text-blue-500" />
              </button>
              <button className={`p-1 rounded-lg ${theme.cardSecondary} hover:bg-opacity-70 transition-colors`}>
                <Edit className="w-4 h-4 text-green-500" />
              </button>
              {/* UPDATE THIS DELETE BUTTON */}
              <button 
                onClick={() => handleDeleteClick(user)}
                className={`p-1 rounded-lg ${theme.cardSecondary} hover:bg-opacity-70 transition-colors`}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </td>
        </tr>
      );
    }


    // Common table row for other roles
    return (
      <tr key={user._id} className={`${theme.borderSecondary} border-b hover:bg-opacity-50 ${theme.cardSecondary} transition-colors`}>
        <td className="px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full ${theme.cardSecondary} flex items-center justify-center`}>
              <UserCheck className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div 
                className={`font-medium ${theme.textPrimary} cursor-pointer hover:text-emerald-500 transition-colors`}
                onClick={() => handleNameClick(user)}
              >
                {user.firstName} {user.lastName}
              </div>
              <div className={`text-sm ${theme.textMuted}`}>@{user.username}</div>
            </div>
          </div>
        </td>
        <td className={`px-6 py-4 text-sm ${theme.textSecondary}`}>{user.gender}</td>
        {/* <td className={`px-6 py-4 text-sm ${theme.textSecondary}`}>{user.cnic}</td> */}
        <td className={`px-6 py-4 text-sm ${theme.textSecondary}`}>{user.phoneNumber}</td>
        <td className="px-6 py-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            user.isActive 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {user.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td className={`px-6 py-4 text-sm ${theme.textSecondary} min-w-48`}>
          {user.lastLogin ? formatDateTime(user.lastLogin) : 'Never'}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => handleNameClick(user)}
              className={`p-1 rounded-lg ${theme.cardSecondary} hover:bg-opacity-70 transition-colors`}
            >
              <Eye className="w-4 h-4 text-blue-500" />
            </button>
            <button className={`p-1 rounded-lg ${theme.cardSecondary} hover:bg-opacity-70 transition-colors`}>
              <Edit className="w-4 h-4 text-green-500" />
            </button>
            {/* UPDATE THIS DELETE BUTTON */}
            <button 
              onClick={() => handleDeleteClick(user)}
              className={`p-1 rounded-lg ${theme.cardSecondary} hover:bg-opacity-70 transition-colors`}
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

 // Filter users based on search term
 const filteredUsers = usersData?.users?.filter(user => {
   if (user.role !== activeTab) return false;
   if (!searchTerm) return true;
   
   const searchLower = searchTerm.toLowerCase();
   return (
     user.firstName?.toLowerCase().includes(searchLower) ||
     user.lastName?.toLowerCase().includes(searchLower)
  //    user.cnic?.includes(searchTerm) ||
  //    user.phoneNumber?.includes(searchTerm) ||
  //    (user.speciality && user.speciality.toLowerCase().includes(searchLower)) ||
  //    (user.registrationNumber && user.registrationNumber.toLowerCase().includes(searchLower))
   );
 }) || [];

 return (
   <div className="p-6">
     {/* Page Title */}
     <motion.div
       initial={{ opacity: 0, y: -20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.5 }}
       className="mb-8"
     >
       <h1 className={`text-3xl font-bold ${theme.textPrimary} mb-2`}>
         All Users Management
       </h1>
       <p className={`${theme.textMuted}`}>
         Manage all healthcare professionals and staff members
       </p>
     </motion.div>

     {/* Summary Cards */}
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.5, delay: 0.1 }}
       className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
     >
       {summaryCards.map((card, index) => (
         <div
           key={index}
           className={`p-6 ${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}
         >
           <div className="flex items-center justify-between">
             <div>
               <p className={`text-sb font-medium ${theme.textMuted}`}>{card.title}</p>
               <p className={`text-3xl font-bold ${theme.textPrimary} mt-2`}>{card.value}</p>
             </div>
             <div className={`p-3 rounded-full ${card.bgColor} border`}>
               <card.icon className={`w-6 h-6 ${card.color}`} />
             </div>
           </div>
         </div>
       ))}
     </motion.div>

     {/* Tabs */}
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.5, delay: 0.2 }}
       className={`${theme.cardOpacity} backdrop-filter backdrop-blur-lg rounded-xl ${theme.border} border`}
     >
       {/* Tab Headers */}
       <div className={`flex flex-wrap ${theme.borderSecondary} border-b `}>
         {tabs.map((tab) => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id)}
             className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors relative ${
               activeTab === tab.id
                 ? `${theme.textPrimary} border-b-2 border-emerald-500`
                 : `${theme.textMuted} hover:${theme.textSecondary}`
             }`}
           >
             <tab.icon className="w-5 h-5" />
             <span>{tab.label}</span>
             <span className={`px-2 py-1 rounded-full text-xs ${
               activeTab === tab.id 
                 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                 : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
             }`}>
               {tab.count}
             </span>
           </button>
         ))}
       </div>

       {/* Tab Content */}
       <div className="p-6">
         {/* Tab Header with Add Button */}
         <div className="flex flex-col sm:flex-row gap-5 justify-between items-start mb-6">
           <div >
             <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-2`}>
               {getTabTitle(activeTab).title}
             </h2>
             <p className={`${theme.textMuted}`}>
               {getTabTitle(activeTab).subtitle}
             </p>
           </div>
           <motion.button
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => handleAddUser(activeTab)}
             className={`flex items-center space-x-2 px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white font-medium rounded-lg shadow-lg ${theme.buttonGradientHover} transition-all duration-200`}
           >
             <UserPlus className="w-5 h-5" />
             <span>{getAddButtonText(activeTab)}</span>
           </motion.button>
         </div>

         {/* Search and Filter */}
         <div className="flex flex-col sm:flex-row gap-4 mb-6">
           <div className="relative flex-1">
             <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`} />
             <input
               type="text"
               placeholder={`Search ${getTabTitle(activeTab).title.toLowerCase()}...`}
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className={`w-full pl-10 pr-4 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
             />
           </div>
           <button className={`flex items-center space-x-2 px-4 py-3 ${theme.textPrimary} ${theme.cardSecondary} rounded-lg ${theme.borderSecondary} border hover:bg-opacity-70 transition-colors`}>
             <Filter className="w-5 h-5" />
             <span>Filter</span>
           </button>
         </div>

         {/* Table */}
         <div className="overflow-x-auto">
           <table className="w-full">
             <thead>
               <tr className={`${theme.borderSecondary} border-b`}>
                 {renderTableHeader(activeTab).map((header) => (
                   <th key={header} className={`px-6 py-3 text-center text-xs font-medium ${theme.textMuted} tracking-wider`}>
                     {header}
                   </th>
                 ))}
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
               {filteredUsers.map((user) => renderTableRow(user, activeTab))}
             </tbody>
           </table>
         </div>

         {/* Empty State */}
         {filteredUsers.length === 0 && (
           <div className="text-center py-12">
             <Users className={`w-16 h-16 ${theme.textMuted} mx-auto mb-4`} />
             <h3 className={`text-lg font-medium ${theme.textPrimary} mb-2`}>
               {searchTerm 
                 ? `No ${getTabTitle(activeTab).title.toLowerCase()} found matching "${searchTerm}"`
                 : `No ${getTabTitle(activeTab).title.toLowerCase()} found`
               }
             </h3>
             <p className={`${theme.textMuted} mb-4`}>
               {searchTerm 
                 ? 'Try adjusting your search terms or clear the search to see all users.'
                 : `Get started by adding your first ${activeTab.replace('_', ' ')}.`
               }
             </p>
             {!searchTerm && (
               <button 
                 onClick={() => handleAddUser(activeTab)}
                 className={`px-4 py-2 bg-gradient-to-r ${theme.buttonGradient} text-white font-medium rounded-lg shadow-lg ${theme.buttonGradientHover} transition-all duration-200`}
               >
                 {getAddButtonText(activeTab)}
               </button>
             )}
           </div>
         )}
       </div>
     </motion.div>

     {/* Registration Modal */}
     <UserRegistrationModal
       isOpen={isModalOpen}
       onClose={() => setIsModalOpen(false)}
       role={selectedRole}
       onSuccess={handleRegistrationSuccess}
     />


      {/* ADD THE DELETE CONFIRMATION MODAL */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onSuccess={handleDeleteSuccess}
        userData={userToDelete}
      />

   </div>
 );
};

export default AllUsers;