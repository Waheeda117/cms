import { motion } from "framer-motion";
import { useTheme } from '../hooks/useTheme';

const LoadingSpinner = () => {
	const { theme } = useTheme();
	
	return (
		<div className={`min-h-screen bg-gradient-to-br ${theme.primary} flex items-center justify-center relative overflow-hidden`}>
			{/* Enhanced Loading Spinner */}
			<div className="flex flex-col items-center space-y-4">
				<motion.div
					className={`w-16 h-16 border-4 border-t-4 border-t-emerald-500 ${theme.textMuted.includes('gray') ? 'border-gray-300' : 'border-slate-300'} rounded-full`}
					animate={{ rotate: 360 }}
					transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
				/>
				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.5 }}
					className={`${theme.textSecondary} text-lg font-medium`}
				>
					Loading...
				</motion.p>
			</div>
		</div>
	);
};

export default LoadingSpinner;