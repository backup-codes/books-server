const multer = require('multer');

const ImageUploader = multer({
	fileFilter: (req, file, cb) => {
		if (file.mimetype.startsWith('image/')) {
			return cb(null, true)
		}
		return cb(null, false)
	},
	limits: {
		fieldSize: 10 * 1024 * 1024,
	},
	storage: multer.diskStorage({
		destination: './uploads',
		filename: (req, file, cb) => {
			const suffix = Date.now() + '-' + `${Math.random()}`.substring(2)
			console.log(suffix,"suffix")
			return cb(null, suffix + '-' + file.originalname)
		},
	}),
})

const PdfUploader = multer({
	fileFilter: (req, file, cb) => {
		if (file.mimetype.startsWith('application/pdf')) {
			return cb(null, true)
		}
		return cb(null, false)
	},
	limits: {
		fieldSize: 10 * 1024 * 1024,
	},
	storage: multer.diskStorage({
		destination: './uploads',
		filename: (req, file, cb) => {
			const suffix = Date.now() + '-' + `${Math.random()}`.substring(2)
			return cb(null, suffix + '-' + file.originalname)
		},
	}),
})

const FileUploader = multer({
	fileFilter: (req, file, cb) => {
		return cb(null, true)
	},
	limits: {
		fieldSize: 10 * 1024 * 1024,
	},
	storage: multer.diskStorage({
		destination: './uploads',
		filename: (req, file, cb) => {
			const suffix = Date.now() + '-' + `${Math.random()}`.substring(2)
			return cb(null, suffix + '-' + file.originalname)
		},
	}),
})

const uploaders = {
  ImageUploader,
  PdfUploader,
  FileUploader
}

module.exports = uploaders