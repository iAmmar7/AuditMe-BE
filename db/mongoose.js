const mongoose = require('mongoose');

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
};

mongoose
  .connect(process.env.MONGO_URI, options)
  .then(() => console.log('MongoDB Connected!'))
  .catch((err) => console.log(err));
