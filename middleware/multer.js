const multer =require('multer')
const path = require('path')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null,path.join(__dirname,'../public/admin/images/'));  //'../public/uploads'
    },
    filename: (req, file, cb) => {
       cb(null, `${Date.now()}-${file.originalname}`);
      
    },
    
  });
  const upload = multer({
    storage: storage,
    // limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
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