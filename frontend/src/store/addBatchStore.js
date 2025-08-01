import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAddBatchStore = create(
  persist(
    (set, get) => ({
      // Form data state
      medicines: [],
      miscellaneousAmount: 0,
      currentMedicine: {
        medicineId: null,
        medicineName: "",
        quantity: "",
        price: "",
        expiryDate: "",
      },
      
      // Batch details (to ensure we're working with the same batch)
      batchDetails: null,
      
      // Actions for medicines
      addMedicine: (medicine) => {
        set((state) => ({
          medicines: [...state.medicines, medicine]
        }));
      },
      
      removeMedicine: (index) => {
        set((state) => ({
          medicines: state.medicines.filter((_, i) => i !== index)
        }));
      },
      
      updateMedicine: (index, updatedMedicine) => {
        set((state) => ({
          medicines: state.medicines.map((medicine, i) => 
            i === index ? { ...medicine, ...updatedMedicine } : medicine
          )
        }));
      },
      
      // Actions for miscellaneous amount
      setMiscellaneousAmount: (amount) => {
        set({ miscellaneousAmount: amount });
      },
      
      // Actions for current medicine form
      setCurrentMedicine: (medicine) => {
        set({ currentMedicine: medicine });
      },
      
      updateCurrentMedicineField: (field, value) => {
        set((state) => ({
          currentMedicine: { ...state.currentMedicine, [field]: value }
        }));
      },
      
      resetCurrentMedicine: () => {
        set({
          currentMedicine: {
            medicineId: null,
            medicineName: "",
            quantity: "",
            price: "",
            expiryDate: "",
          }
        });
      },
      
      // Batch details actions
      setBatchDetails: (details) => {
        set({ batchDetails: details });
      },
      
      // Check if current batch matches stored batch
      isSameBatch: (newBatchDetails) => {
        const currentBatch = get().batchDetails;
        if (!currentBatch || !newBatchDetails) return false;
        return (
          currentBatch.batchNumber === newBatchDetails.batchNumber &&
          currentBatch.billID === newBatchDetails.billID
        );
      },
      
      // Clear all data (for when batch is submitted or user switches batches)
      clearBatchData: () => {
        set({
          medicines: [],
          miscellaneousAmount: 0,
          currentMedicine: {
            medicineId: null,
            medicineName: "",
            quantity: "",
            price: "",
            expiryDate: "",
          },
          batchDetails: null,
        });
      },
      
      // Initialize or clear data based on batch
      initializeBatch: (newBatchDetails) => {
        const isSame = get().isSameBatch(newBatchDetails);
        if (!isSame) {
          // Different batch, clear old data
          get().clearBatchData();
          set({ batchDetails: newBatchDetails });
        }
        // If same batch, keep existing data
      },
    }),
    {
      name: "add-batch-storage",
      // Only persist the data we need
      partialize: (state) => ({
        medicines: state.medicines,
        miscellaneousAmount: state.miscellaneousAmount,
        currentMedicine: state.currentMedicine,
        batchDetails: state.batchDetails,
      }),
    }
  )
);