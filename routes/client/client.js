if (process.env.NODE_ENV !== "production")  {
    require("dotenv").config();
};
const express = require("express");
const router = express.Router();
const Member = require("../../models/member");
const Resource = require("../../models/resource");

// ROUTES
router.get("/", (req, res) => {
    res.render("client/index");
});

router.get("/members", async (req, res) => {
    let members = await Member.find();
    res.render("client/members.ejs", { members: members });
});

router.get("/resources", async (req, res) => {
    let resources = await Resource.find();
    res.render("client/resources", { resources: resources });
});

router.get("/archives", (req, res) => {
    res.render("client/com");
});
router.get("/blogs", (req, res) => {
    res.render("client/com");
});
router.get("/contacts", (req, res) => {
    res.render("client/com");
});
router.get("/alumni", (req, res) => {
    res.render("client/com");
});

// EXPORT
module.exports = router;
