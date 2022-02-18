// determines the type of the bar code based on the length of digits.
module.exports = (scanCode) => {

  const codeLength = scanCode.length;

  // 13 || 12 as UPCA
  if (14 > codeLength && codeLength > 11) {
    return 'upca';
  }
  // 5 || 4 as PLU (Product Look Up)
  if (6 > codeLength && codeLength > 3) {
    return 'plu';
  }

  // UPCE with lengt 8
  if (codeLength === 8) {
    return 'upce';
  }
  // old bizerba scales
  if (codeLength === 26 || codeLength === 19 || codeLength === 30) {
    return 'code 128';
  }

  if (codeLength === 16) {
    return 'databar';
  }

  if (codeLength === 16) {
    return 'databar';
  }

  // if it doesn't match, return upc
  return 'upc';
};