import { create } from "zustand";
import { persist } from "zustand/middleware";

const initialState = {
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
  attachments: [],
};

export const useAddBatchStore = create(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Actions
      setMedicines: (medicines) => set({ medicines }),
      setMiscellaneousAmount: (amount) => set({ miscellaneousAmount: amount }),
      setCurrentMedicine: (currentMedicine) => set({ currentMedicine }),
      setBatchDetails: (batchDetails) => set({ batchDetails }),
      setAttachments: (attachments) => set({ attachments }),
      
      // Reset store when batch is submitted/cancelled
      reset: () => set(initialState),
      
      // Set default expiry date for current medicine
      setDefaultExpiryDate: () => {
        const defaultExpiryDate = new Date();
        defaultExpiryDate.setFullYear(defaultExpiryDate.getFullYear() + 2);
        const defaultExpiryString = defaultExpiryDate.toISOString().split("T")[0];
        
        set(state => ({
          currentMedicine: {
            ...state.currentMedicine,
            expiryDate: defaultExpiryString
          }
        }));
      }
    }),
    {
      name: "add-batch-storage",
    }
  )
);