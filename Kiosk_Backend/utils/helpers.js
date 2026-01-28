const helpers = {
  // Format bytes to human readable format
  formatBytes: (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },
  
  // Calculate percentage
  calculatePercentage: (part, total) => {
    if (total === 0) return 0;
    return (part / total) * 100;
  },
  
  // Generate unique ID
  generateId: () => {
    return 'id_' + Math.random().toString(36).substr(2, 9);
  },
  
  // Sleep function
  sleep: (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  // Validate IP address
  isValidIp: (ip) => {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  },
  
  // Get current timestamp in ISO format
  getTimestamp: () => {
    return new Date().toISOString();
  }
};

module.exports = helpers;