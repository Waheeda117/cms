const formatDate = (dateString) => {
	const date = new Date(dateString);
	if (isNaN(date.getTime())) {
		return "Invalid Date";
	}

	return date.toLocaleString("en-US", {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
	});
};

export default formatDate;