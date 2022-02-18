const UpcEtoAtype = require('./UpcEtoAtype');

const upcAcodes = (scanCode) => {
  let scanCodeNew = null,
    sellPrice = null;
  // ios return with 0 in the front of upc type 2 so trimming it
  if (scanCode.startsWith('02') && scanCode.length === 13) {
    scanCode = scanCode.substring(1);
  }

  // scan code that are length of 12 or 13 and starts with 2, are price embedded items
  if (scanCode.startsWith('2')) {
    let manufactureCode;
    if (scanCode.length === 13) {
      manufactureCode = scanCode.substring(2, 7);
      sellPrice = parseFloat(scanCode.substring(7, 12)) / 100;
    } else {
      manufactureCode = scanCode.substring(1, 6);
      sellPrice = parseFloat(scanCode.substring(7, 11)) / 100;
    }
    const scanCodeTrimed = `2${manufactureCode}00000`;
    // pad with 0's if the length is not 13
    scanCodeNew = scanCodeTrimed.padStart(13, '0');
  } else if (scanCode === '021130240302') {
    // differentiating water botel and whole pack as both has same PLU
    scanCodeNew = '0000000020353';
  } else {
    const scanCodeTrimed = scanCode.substring(0, scanCode.length - 1);
    scanCodeNew = scanCodeTrimed.padStart(13, '0');
  }
  return {
    scanCodeNew, sellPrice
  };

};

const upcEcodes = (context, scanCode) => {
  let scanCodeNew = null;
  // 8 digit barcode
  // have to convert UPCE to UPCA refer to that function
  scanCodeNew = UpcEtoAtype(context, scanCode);
  if (scanCodeNew !== null) {
    const scanCodeTrimed = scanCodeNew.substring(0, scanCodeNew.length - 1);
    scanCodeNew = scanCodeTrimed.padStart(13, '0');
  }
  return scanCodeNew;
};

const pluCodes = (scanCode) => {
  // plu is 4 or 5 digits. Append 0's to make it 13.
  return scanCode.padStart(13, '0');
};

const dataBar = (scanCode) => {
  // gs1 barcodes are the ones that are on some of the produce items
  // length is 16 with first 2 and last being check digits, trim it
  return scanCode.substring(2, 15);
};

const code128codes = (scanCode) => {
  let scanCodeNew = null;

  if (scanCode.length === 26 || scanCode.length === 19) {
    // 0100000000(94023)83203(002280)
    // PLU = 94023
    scanCodeNew = scanCode.substring(10, 15).padStart(13, '0');
  } else {
    // ex. 01002(04080)00000830003103(001230)
    // PLU = 04080 = 4080
    scanCodeNew = scanCode.substring(5, 10).padStart(13, '0');
  }
  // last 6 digits represent weight
  const weight = parseFloat(scanCode.slice(-6)) / 1000;

  return {
    weight,
    scanCodeNew
  };
};

const newScanCode = (context, upcType, scanCode) => {
  let scanCodeNew = null,
    sellPrice = null,
    weight = null,
    pluCode = null;

  upcType = upcType.toUpperCase();

  if ((upcType === 'UPCA' || upcType === 'EAN13')) {

    const formattedCode = upcAcodes(scanCode);
    scanCodeNew = formattedCode.scanCodeNew;
    sellPrice = formattedCode.sellPrice;

  } else if (upcType === 'UPCE') {
    scanCodeNew = upcEcodes(context, scanCode);

  } else if (upcType === 'CODE 128') {

    const code128Formating = code128codes(scanCode);
    weight = code128Formating.weight;
    scanCodeNew = code128Formating.scanCodeNew;

  } else if (upcType === 'PLU') {

    pluCode = scanCode;
    scanCodeNew = pluCodes(scanCode);

  } else if (upcType === 'DATABAR' && scanCode.length === 16) {
    scanCodeNew = dataBar(scanCode);
  } else {
    scanCodeNew = scanCode;
  }
  return {
    scanCodeNew,
    sellPrice,
    weight,
    pluCode
  };
};

module.exports = {
  upcAcodes,
  upcEcodes,
  pluCodes,
  dataBar,
  code128codes,
  newScanCode
};
