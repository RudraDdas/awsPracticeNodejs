const express = require("express")
const cors = require('cors')
const bodyParser = require('body-parser');
const router = express()
router.use(cors())
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
const AWS = require("aws-sdk");
const s3 = new AWS.S3({ apiVersion: '2006-03-01', region: 'ap-south-1', accessKeyId: 'AKIA4MRECWEHDMVSXGFP', secretAccessKey: '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' });
const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({
    storage: storage,
    limits: { files: 10, parts: 20, fields: 10, fileSize: 100000000 },
    fileFilter: (req, file, cb) => {
        console.log("reqqq,", file)
        if (file.mimetype !== 'image/jpeg') {
            cb(null, false)
        } else {
            cb(null, true)
        }
    }
})


router.listen('3001', () => {
    console.log("listening to the port 3001")
})


router.post('/putinawsbucket', upload.single('file'), async (req, res) => {
    try {
        console.log("console.log", req.file)
        const upload = await s3.upload({
            Bucket: 'awsbucketrudradaspractice',
            Body: req.file.buffer,
            Key: `demo1/${req.file.originalname}`,
        }).promise()
        if (upload) {
            console.log("uploaddddd", upload)
            res.status(200).json(upload)
        }
    } catch (error) {
        res.status(500).send(error.message)
        console.log("errror is=======>", error)
    }
})
router.delete("/deleteinsertimg", async (req, res) => {
    try {
        console.log("request", req.query)
        if (req.query.imageid) {
            const result = await s3.deleteObject({ Bucket: 'awsbucketrudradaspractice', Key: req.query.imageid }).promise()
            if (result) {
                res.status(200).send(result)
            }
        }

    } catch (error) {
        console.log(error)
        res.status(500).send(error.message)
    }
})