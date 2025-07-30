import { useTheme } from '../hooks/useTheme';

const Input = ({ icon: Icon, ...props }) => {
	const { theme } = useTheme();
	
	return (
		<div className='relative mb-6'>
			<div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
				<Icon className={`size-5 ${theme.textMuted}`} />
			</div>
			<input
				{...props}
				className={`w-full pl-10 pr-3 py-2 ${theme.input} rounded-lg ${theme.borderSecondary} border ${theme.focus} focus:ring-2 ${theme.textPrimary} placeholder-${theme.textMuted.split('-')[1]}-400 transition duration-200`}
			/>
		</div>
	);
};

export default Input;