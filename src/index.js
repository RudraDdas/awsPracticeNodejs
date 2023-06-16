const express = require("express")
const cors = require('cors')
const bodyParser = require('body-parser');
const router = express()
router.use(cors())
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

const AWS = require("aws-sdk");
const s3 = new AWS.S3({ apiVersion: '2006-03-01', region: 'ap-south-1', accessKeyId: process.env.ACCESSId, secretAccessKey: process.env.SecreateKey });
const sqs = new AWS.SQS({ apiVersion: '2012-11-05', region: 'ap-south-1', accessKeyId: process.env.ACCESSId, secretAccessKey: process.env.SecreateKey })

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

router.post('/createQueue', async (req, res) => {
    try {
        if (!req.body.queName) {
            console.log("Parameter Missing =====> Quename", req.body)
            res.status(404).send("Que name can not be empty")
        } else {
            console.log("postrequest", req.body.queName)
            const params = {
                QueueName: req.body.queName,
                Attributes: {
                    'DelaySeconds': '6',
                    'MessageRetentionPeriod': '86400'
                }
            }
            const result = await sqs.createQueue(params, (error, data) => {
                if (error) {
                    res.status(300).send(error.message)
                } else {
                    res.status(200).send(data)
                }
            })
        }
    } catch (error) {
        res.status(500).send(error.message)
    }

})

router.post("/sendmessage", async (req, res) => {
    try {
        const sqsArr = []
        for (let index = 0; index < 10; index++) {
            const params = {
                MessageBody: `the queues are${index}`,
                QueueUrl: process.env.SQS_QUEUE,
                DelaySeconds: 5,
            }
            const sqsResult = await sqs.sendMessage(params).promise()
            sqsArr.push(sqsResult)
        }
        console.log("new message", sqsArr)
        res.status(200).send(sqsArr)
        // const result = await sqs.sendMessage()
    } catch (error) {
        console.log("internal server Error", error.message)
        res.status(500).send(error.message)
    }
})

router.get("/removemsg", async (req, res) => {
    try {
        const paramsObj = {
            QueueUrl: process.env.SQS_QUEUE
        }
        const receivedData = await sqs.receiveMessage(paramsObj).promise()
        if (receivedData) {
            // res.status(200).send(receivedData)
            const deleteUrl = {
                QueueUrl: process.env.SQS_QUEUE,
                ReceiptHandle: receivedData.Messages[0].ReceiptHandle
            }
            const deleteMsg = await sqs.deleteMessage(deleteUrl).promise()
            if (deleteMsg) {
                res.status(200).send(deleteMsg)
            }
        }
    } catch (error) {
        res.status(500).send(error.message)
    }
})