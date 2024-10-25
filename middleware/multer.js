const multer =require('multer')
const path = require('path')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null,path.join(__dirname,'../public/admin/images/'));  
    },
    filename: (req, file, cb) => {
       cb(null, `${Date.now()}-${file.originalname}`);
      
    },
    
  });
  const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
      const fileTypes = /jpeg|jpg|png/;
      const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = fileTypes.test(file.mimetype);
  
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Images only!'));
      }
    }
  });
  module.exports = upload