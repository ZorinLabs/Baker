export const getCurrency = () => {
  return localStorage.getItem('POS_CURRENCY') || 'USD';
};

export const setCurrency = (curr) => {
  localStorage.setItem('POS_CURRENCY', curr);
  window.dispatchEvent(new Event('storage')); // Trigger update across tabs/components
};

export const formatCurrency = (amount) => {
  const code = getCurrency();
  const num = amount || 0;
  
  if (code === 'LKR') {
    return `Rs. ${(num * 300).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
