function generateBillId() {
    const firstDigit = Math.floor(Math.random() * 9) + 1; 
    const randomNumbers = `${firstDigit}${Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('')}`;
    console.log(randomNumbers);
  
    return randomNumbers;
  }
  
  module.exports = {
    generateBillId
  };
  