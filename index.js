require("dotenv").config()
const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const { URL } = require("url")

const app = express()

// Basic Configuration
const port = process.env.PORT || 3000

mongoose.connect(process.env.MONGO_URI)

app.use(cors())

app.use(bodyParser.urlencoded({ extended: false }))

app.use("/public", express.static(`${process.cwd()}/public`))

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html")
})

const urlsSchema = new mongoose.Schema({
  url: String,
  shorturl: Number,
})

const counterSchema = {
  id: {
    type: String,
  },
  seq: {
    type: Number,
  },
}

const URLS = mongoose.model("URLS", urlsSchema)
const counterModel = mongoose.model("Counter", counterSchema)

const hasHttpsAndWwwFunc = (url) => {
  try {
    const parsedUrl = new URL(url)
    return (
      (parsedUrl.protocol === "https:" &&
        parsedUrl.hostname.startsWith("www.")) ||
      (parsedUrl.protocol === "http:" && parsedUrl.hostname.startsWith("www."))
    )
  } catch {
    return false
  }
}

// Your first API endpoint
app.post("/api/shorturl", async (req, res) => {
  let sentUrl = req.body.url
  const hasHttpsAndWww = hasHttpsAndWwwFunc(sentUrl)

  if (hasHttpsAndWww) {
    let seqId = await counterModel.findOneAndUpdate(
      { id: "autoval" },
      { $inc: { seq: 1 } },
      { new: true }
    )

    if (seqId == null) {
      const newval = new counterModel({ id: "autoval", seq: 1 })
      await newval.save()
      seqId = 1
      const dataToSend = {
        url: sentUrl,
        shorturl: seqId.seq,
      }

      const newUrl = new URLS(dataToSend)
      res.json(dataToSend)
      await newUrl.save()
    } else {
      const dataToSend = {
        url: sentUrl,
        shorturl: seqId.seq,
      }

      const newUrl = new URLS(dataToSend)
      res.json(dataToSend)
      await newUrl.save()
    }
  } else {
    res.json({ error: "invalid url" })
  }
})

const getWebsite = (getNumber) => {
  return URLS.find({ shorturl: getNumber }).then((urlFound) => {
    if (urlFound) {
      return urlFound
    } else {
      return null
    }
  })
}

app.get("/api/shorturl/:number", async (req, res) => {
  const getNumber = req.params.number

  if (getNumber == null) {
    res.json({ message: "Whoops...some error occured" })
  } else {
    const redirectUrl = await getWebsite(getNumber)
    res.redirect(redirectUrl[0]["url"])
  }
})

app.listen(port, function () {
  console.log(`Listening on port ${port}`)
})
