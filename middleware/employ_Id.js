function generateEmployId(prefix = "BIPL") {
  const randomNumber = Math.floor(Math.random() * 10000).toString().padStart(4, "0");

  const uniqueID = `${prefix}${randomNumber}`;

  return uniqueID;
}

module.exports = {
  generateEmployId,
};
