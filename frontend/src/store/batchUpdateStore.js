import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useBatchUpdateStore = create(
  persist(
    (set, get) => ({
      // Batch-specific data storage
      batchData: {},

      // Set batch data for a specific batch ID
      setBatchData: (batchId, data) =>
        set((state) => ({
          batchData: {
            ...state.batchData,
            [batchId]: {
              ...state.batchData[batchId],
              ...data,
              lastUpdated: Date.now(),
            },
          },
        })),

      // Get batch data for a specific batch ID
      getBatchData: (batchId) => {
        const state = get();
        return state.batchData[batchId] || null;
      },

      // Update medicines list for a specific batch
      updateMedicines: (batchId, medicines) =>
        set((state) => ({
          batchData: {
            ...state.batchData,
            [batchId]: {
              ...state.batchData[batchId],
              medicines,
              lastUpdated: Date.now(),
            },
          },
        })),

      // Update miscellaneous amount for a specific batch
      updateMiscellaneousAmount: (batchId, amount) =>
        set((state) => ({
          batchData: {
            ...state.batchData,
            [batchId]: {
              ...state.batchData[batchId],
              miscellaneousAmount: amount,
              lastUpdated: Date.now(),
            },
          },
        })),

      // Update current medicine form for a specific batch
      updateCurrentMedicine: (batchId, currentMedicine) =>
        set((state) => ({
          batchData: {
            ...state.batchData,
            [batchId]: {
              ...state.batchData[batchId],
              currentMedicine,
              lastUpdated: Date.now(),
            },
          },
        })),

      // Clear data for a specific batch (after successful submit or explicit clear)
      clearBatchData: (batchId) =>
        set((state) => {
          const newBatchData = { ...state.batchData };
          delete newBatchData[batchId];
          return { batchData: newBatchData };
        }),

      // Clear all batch data
      clearAllBatchData: () => set({ batchData: {} }),

      // Auto-cleanup old data (older than 7 days)
      cleanupOldData: () =>
        set((state) => {
          const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          const newBatchData = {};
          
          Object.entries(state.batchData).forEach(([batchId, data]) => {
            if (data.lastUpdated > sevenDaysAgo) {
              newBatchData[batchId] = data;
            }
          });
          
          return { batchData: newBatchData };
        }),
    }),
    {
      name: 'batch-update-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ batchData: state.batchData }),
    }
  )
);