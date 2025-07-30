export const SPECIALITIES = [
  "Cardiologist",
  "Dermatologist",
  "Neurologist",
  "Pediatrician",
  "Psychiatrist",
  "Orthopedic Surgeon",
  "Radiologist",
  "General Surgeon",
  "Oncologist",
  "Endocrinologist",
  "Ophthalmologist",
  "ENT Specialist",
];

export const MEDICINES = [
  { id: 1, name: "MISCELLANEOUS" },

  // Paracetamol variants
  { id: 2, name: "Paracetamol 500mg Tab" },
  { id: 3, name: "Paracetamol 250mg Tab" },
  { id: 4, name: "Paracetamol 120mg5ml Syp" },
  { id: 5, name: "Paracetamol 80mg Drop" },
  
  // Ibuprofen variants
  { id: 6, name: "Ibuprofen 400mg Tab" },
  { id: 7, name: "Ibuprofen 200mg Tab" },
  { id: 8, name: "Ibuprofen 100mg5ml Syp" },
  
  // Aspirin variants
  { id: 9, name: "Aspirin 75mg Tab" },
  { id: 10, name: "Aspirin 300mg Tab" },
  
  // Amoxicillin variants
  { id: 11, name: "Amoxicillin 500mg Tab" },
  { id: 12, name: "Amoxicillin 250mg Tab" },
  { id: 13, name: "Amoxicillin 125mg5ml Syp" },
  { id: 14, name: "Amoxicillin 250mg5ml Syp" },
  
  // Omeprazole variants
  { id: 15, name: "Omeprazole 20mg Tab" },
  { id: 16, name: "Omeprazole 40mg Tab" },
  
  // Metformin variants
  { id: 17, name: "Metformin 500mg Tab" },
  { id: 18, name: "Metformin 850mg Tab" },
  { id: 19, name: "Metformin 1000mg Tab" },
  
  // Insulin variants
  { id: 20, name: "Insulin Glargine 100IUml Inj" },
  { id: 21, name: "Insulin Regular 100IUml Inj" },
  
  // Antibiotics
  { id: 22, name: "Ciprofloxacin 500mg Tab" },
  { id: 23, name: "Ciprofloxacin 250mg Tab" },
  { id: 24, name: "Azithromycin 500mg Tab" },
  { id: 25, name: "Azithromycin 250mg Tab" },
  { id: 26, name: "Doxycycline 100mg Tab" },
  { id: 27, name: "Cephalexin 500mg Tab" },
  
  // Respiratory medications
  { id: 28, name: "Albuterol 2.5mg3ml Inj" },
  { id: 29, name: "Salbutamol 100mcg Inj" },
  { id: 30, name: "Montelukast 10mg Tab" },
  { id: 31, name: "Fluticasone 50mcg Drop" },
  
  // Cardiovascular medications
  { id: 32, name: "Atorvastatin 20mg Tab" },
  { id: 33, name: "Atorvastatin 40mg Tab" },
  { id: 34, name: "Lisinopril 10mg Tab" },
  { id: 35, name: "Lisinopril 20mg Tab" },
  { id: 36, name: "Metoprolol 50mg Tab" },
  { id: 37, name: "Amlodipine 5mg Tab" },
  { id: 38, name: "Amlodipine 10mg Tab" },
  
  // Antidepressants
  { id: 39, name: "Sertraline 50mg Tab" },
  { id: 40, name: "Sertraline 100mg Tab" },
  { id: 41, name: "Fluoxetine 20mg Tab" },
  { id: 42, name: "Escitalopram 10mg Tab" },
  
  // Pain medications
  { id: 43, name: "Tramadol 50mg Tab" },
  { id: 44, name: "Diclofenac 50mg Tab" },
  { id: 45, name: "Naproxen 500mg Tab" },
  { id: 46, name: "Morphine 10mgml Inj" },
  
  // Topical medications
  { id: 47, name: "Diclofenac Ointment" },
  { id: 48, name: "Hydrocortisone Ointment" },
  { id: 49, name: "Clotrimazole Ointment" },
  
  // Diabetes medications (Note: Metformin already exists above)
  { id: 50, name: "Glipizide 5mg Tab" },
  { id: 51, name: "Insulin Lispro 100IUml Inj" },
  
  // Antifungal
  { id: 52, name: "Fluconazole 150mg Tab" },
  { id: 53, name: "Ketoconazole 200mg Tab" },
  
  // Vitamins and supplements
  { id: 54, name: "Vitamin D3 60000IU Tab" },
  { id: 55, name: "Vitamin B12 1000mcg Tab" },
  { id: 56, name: "Calcium Carbonate 500mg Tab" },
  { id: 57, name: "Iron Sulfate 325mg Tab" },
  
  // Eye drops
  { id: 58, name: "Timolol Drop" },
  { id: 59, name: "Latanoprost Drop" },
  { id: 60, name: "Ciprofloxacin Drop" },
];

// Helper function to get medicine by ID
export const getMedicineById = (id) => {
  return MEDICINES.find(medicine => medicine.id === id);
};

// Helper function to get medicine by name
export const getMedicineByName = (name) => {
  return MEDICINES.find(medicine => medicine.name === name);
};

export const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];