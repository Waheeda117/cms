import { CreditCard } from "lucide-react";
import { useTheme } from '../hooks/useTheme';

const CNICInput = ({ value, onChange, placeholder = "CNIC (12345-1234567-1)", error }) => {
  const { theme } = useTheme();

  const formatCNIC = (input) => {
    const cleaned = input.replace(/\D/g, '');
    if (cleaned.length <= 5) {
      return cleaned;
    } else if (cleaned.length <= 12) {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    } else {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12, 13)}`;
    }
  };

  const handleChange = (e) => {
    const formatted = formatCNIC(e.target.value);
    onChange(formatted);
  };

  return (
    <div className="relative mb-2">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <CreditCard className={`w-5 h-5 ${theme.textMuted}`} />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        maxLength={15}
        autoComplete="off"
        inputMode="numeric"
        className={`w-full pl-10 pr-3 py-3 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} transition duration-200`}
      />
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
};

export default CNICInput;
