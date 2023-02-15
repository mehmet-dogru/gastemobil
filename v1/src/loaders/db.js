const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose
    .connect(process.env.MONGODB_CONNECTION_STRING)
    .then(() => {
      console.log("Veritabanına bağlantı başarılı => :)");
    })
    .catch(() => {
      console.log("DB bağlantısı başarısız! => :(");
    });
};

module.exports = {
  connectDB,
};
