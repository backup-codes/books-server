const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3')
const fs = require('fs');
require('dotenv').config();

const S3 = new S3Client({
	region:process.env.S3_REGION,
	credentials: {
		accessKeyId:process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	},
})

// file can be buffer or path
function deleteFile(file) {
	try {
		if (typeof file === 'string') {
			fs.unlinkSync(file)
			console.log(`File ${file} deleted!`)
		} else {
			fs.unlinkSync(file.path)
			console.log(`File ${file.filename} deleted!`)
		}
	} catch {
		console.log(error)
	}
}

// file can be buffer or path
async function uploadFile(file, cloudFilePath) {
	try {
	
		const fileBuffer = file instanceof Buffer ? file : await fs.promises.readFile(file.path)

		const command = new PutObjectCommand({
			Bucket:process.env.S3_BUCKET,
			Key: cloudFilePath,
			Body: fileBuffer,
			ACL: 'public-read',
		})

		await S3.send(command)
		return true
	} catch (error) {
		console.log(error)
		return false
	}
}




async function deleteS3File(path, completeUrl = true) {
	try {
		if (!path) {
			console.log('File path is undefined or empty.');
			return;
		}

		if (completeUrl) {
			const initial = getS3FileUrl('');
			path = path.slice(initial.length);
		}

		const command = new DeleteObjectCommand({
			Bucket: process.env.S3_BUCKET,
			Key: path,
		});

		await S3.send(command);
		console.log(`File deleted successfully.`);
	} catch (error) {
		console.log(error);
	}
}

function deleteOldFiles(directory = 'uploads', maxAgeInMinutes = 5) {
	try {
		const currentTime = new Date()
		const maxAge = maxAgeInMinutes * 60 * 1000

		const files = fs.readdirSync(directory)
		for (const file of files) {
			const filePath = directory + '/' + file
			const stats = fs.statSync(filePath)
			const fileAge = currentTime.getTime() - stats.birthtime.getTime()

			if (fileAge > maxAge) {
				fs.unlinkSync(filePath)
				console.log(`Deleted: ${filePath}`)
			}
		}
	} catch (err) {
		console.error(err)
	}
}

function getS3FileUrl(path) {
	
	return `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${path}`
}

const helpers = {
  deleteFile,
  uploadFile,
  deleteS3File,
	getS3FileUrl,
	deleteOldFiles
}

module.exports = helpers