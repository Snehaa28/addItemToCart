/*
  This function converts UPCE barcodes to UPCA.
  UPCE barcodes are condensed/reduced version of UPCA barcodes.
  These are usally found on small items, as there is no enough room to put the full UPCA barcode.
  As these are condensed, they can be placed on small items.
*/
module.exports = (context, upcEInput) => {

  let upcA = null;
  if (upcEInput != null) {
    try {
      const len = upcEInput.length;
      const checkDigit = String(upcEInput.substring(len - 1));
      const [
        startDigit,
        firstDigit,
        secondDigit,
        thirdDigit,
        fourthDigit,
        fifthDigit,
        lastDigit
      ] = upcEInput;

      const startToFourth = startDigit + firstDigit + secondDigit + thirdDigit + fourthDigit;
      const thirdToCheckDig = thirdDigit + fourthDigit + fifthDigit + checkDigit;
      const checkFlag = parseInt(lastDigit, 10);

      switch (checkFlag) {
        case 0:
          upcA = '' + startDigit + firstDigit + secondDigit + '00000' + thirdToCheckDig;
          break;
        case 1:
          upcA = '' + startDigit + firstDigit + secondDigit + '10000' + thirdToCheckDig;
          break;
        case 2:
          upcA = '' + startDigit + firstDigit + secondDigit + '20000' + thirdToCheckDig;
          break;
        case 3:
          upcA = '' + startToFourth + '00000' + fifthDigit + checkDigit;
          break;
        case 4:
          upcA = '' + startToFourth + '00000' + fifthDigit + checkDigit;
          break;
        case 5:
          upcA = '' + startToFourth + fifthDigit + '00005' + checkDigit;
          break;
        case 6:
          upcA = '' + startToFourth + fifthDigit + '00006' + checkDigit;
          break;
        case 7:
          upcA = '' + startToFourth + fifthDigit + '00007' + checkDigit;
          break;
        case 8:
          upcA = '' + startToFourth + fifthDigit + '00008' + checkDigit;
          break;
        case 9:
          upcA = '' + startToFourth + fifthDigit + '00009' + checkDigit;
          break;
        default:
          upcA = upcEInput;
      }
      context.log('itemLookup: converted UPCE as UPCA:-', upcEInput, upcA);
      return upcA;
    } catch (e) {
      context.log('upce conversion error', e);
    }
  }
  return null;
};
