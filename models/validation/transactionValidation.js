const validationObjects = {
  userId: {
    validator: function (email) {
      const emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
      return emailRegex.test(email);
    },
    message: '{VALUE} is not a valid email.'
  },
  banner: {
    validator: function (banner) {
      return /safeway|albertsons/i.test(banner);
    },
    message: '{VALUE} is not a valid banner'
  }
}

module.exports = validationObjects;
