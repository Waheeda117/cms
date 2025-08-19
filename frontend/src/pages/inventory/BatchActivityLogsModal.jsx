import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Activity, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Clock, 
  User 
} from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import Modal from "../../components/UI/Modal";
import formatDate from "../../utils/date";
import { getBatchActivityLogs } from "../../api/api";


const BatchActivityLogsModal = ({ 
  isOpen, 
  onClose, 
  batchNumber,
  batchId 
}) => {
  const { theme } = useTheme();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch logs when modal opens
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const data = await getBatchActivityLogs(batchId);
        setLogs(data.data.logs);
      } catch (err) {
        setError("Failed to fetch activity logs");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && batchId) {
      fetchLogs();
    }
  }, [isOpen, batchId]);

  // Get icon and color based on action type
  const getActionIcon = (action) => {
    switch (action) {
      case "CREATED":
        return { icon: Plus, color: "text-emerald-500" };
      case "UPDATED":
        return { icon: Edit, color: "text-yellow-500" };
      case "DELETED":
        return { icon: Trash2, color: "text-red-500" };
      case "APPROVED":
        return { icon: Check, color: "text-green-500" };
      case "REJECTED":
        return { icon: X, color: "text-red-500" };
      default:
        return { icon: Activity, color: "text-blue-500" };
    }
  };

  // Format change details
  const formatChange = (change) => {
    const formatValue = (value) => {
      if (typeof value === "number") return `PKR ${value}`;
      if (typeof value === "boolean") return value ? "Yes" : "No";
      return value || "N/A";
    };

    return (
      <div className="flex flex-wrap gap-1">
        <span className="font-medium">{change.field}:</span>
        <span className="line-through text-red-400 mr-1">
          {formatValue(change.oldValue)}
        </span>
        <span className="text-emerald-400">→ {formatValue(change.newValue)}</span>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Activity Logs - Batch ${batchNumber}`}
      subtitle={`${logs.length} activities recorded`}
    >
      <div className="max-h-[60vh]">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : error ? (
          <div className={`text-center py-6 ${theme.textPrimary}`}>
            <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-3" />
            <p className="text-red-400">{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-6">
            <Activity className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className={theme.textMuted}>No activity logs found</p>
          </div>
        ) : (
          <div className="space-y-4 py-2 mb-16">
            {logs.map((log, index) => {
              const { icon: ActionIcon, color } = getActionIcon(log.action);
              return (
                <motion.div
                  key={log._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-2 m-4 mb rounded-lg ${theme.cardSecondary} border ${theme.borderSecondary}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${theme.card} mt-1`}>
                      <ActionIcon className={`w-5 h-5 ${color}`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div>
                          {/* <h3 className={`font-semibold ${theme.textPrimary}`}>
                            {log.action.charAt(0) + log.action.slice(1).toLowerCase()}
                          </h3> */}
                          <p className={`text-sm ${theme.textSecondary} mt-1`}>
                            {log.details}
                          </p>
                        </div>
                        
                        {/* <div className="flex items-center gap-2 text-sm">
                          <Clock className={`w-4 h-4 ${theme.textMuted}`} />
                          <span className={theme.textMuted}>
                            {formatDate(log.timestamp)}
                          </span>
                        </div> */}
                      </div>
                      
                      {/* {log.changes && log.changes.length > 0 && (
                        <div className={`mt-3 p-3 rounded-lg ${theme.card} text-sm`}>
                          <h4 className={`font-medium ${theme.textPrimary} mb-2`}>
                            Changes:
                          </h4>
                          <div className="space-y-2">
                            {log.changes.map((change, i) => (
                              <div key={i}>{formatChange(change)}</div>
                            ))}
                          </div>
                        </div>
                      )} */}
                      
                      <div className="flex items-center gap-2 mt-3 text-sm">
                        <User className={`w-4 h-4 ${theme.textMuted}`} />
                        <span className={theme.textMuted}>
                          {log.owner?.username || "System"}
                        </span>
                        <Clock className={`w-4 h-4 ${theme.textMuted}`} />
                          <span className={theme.textMuted}>
                            {formatDate(log.timestamp)}
                          </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default BatchActivityLogsModal;