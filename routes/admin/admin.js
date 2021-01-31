const express = require("express");
const router = express.Router();
const User = require("../../models/user");
const bcrypt = require("bcrypt");
const Member = require("../../models/member");
const Alumni = require("../../models/alumni");
const Contact = require("../../models/contact");
const methodOverride = require('method-override');
const multer = require("multer");
const Grid = require("gridfs-stream");
const path = require("path");
const mongoose = require("mongoose");
const uuid = require("uuid");
const sharp = require("sharp");
const fs = require("fs");

// SETTINGS
router.use(express.json());
router.use(express.urlencoded({ extended: false }));
router.use(methodOverride("_method"));

// GRIDFS SETTINGS
const conn = mongoose.connection;
let gfs;
conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection("fs");
});

const storage = multer.diskStorage({
  destination: ".",
  filename: (req, file, cb) => {
    cb(null, `${uuid.v4()}-${Date.now()}` + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage, limits: { fileSize: 1572864 } });

// ROUTES
router.get("/", async (req, res) => {
    let user = await User.findById(req.user.id);
    res.render("home/admin", { user: user });
});

// Get All
router.get("/users", async (req, res) => {
    let users = await User.find();
    let user = await User.findById(req.user.id); 
    res.render("manage/users", { users: users, visitor: user });
});
router.get("/members", async (req, res) => {
    let members = await Member.find();
    let user = await User.findById(req.user.id);
    res.render("manage/members", { members: members, user: user });
});
router.get("/alumnis", async (req, res) => {
    let alumnis = await Alumni.find();
    let user = await User.findById(req.user.id);
    res.render("manage/alumnis", { alumnis: alumnis, user: user });
});
router.get("/contacts", async (req, res) => {
    let contacts = await Contact.find();
    let user = await User.findById(req.user.id);
    res.render("manage/contacts", { contacts: contacts, user: user });
});

// ADD
router.get("/add-user", checkSupreme, (req, res) => {
    res.render("add/add-user", { message: false });
});
router.post("/add-user", checkSupreme, async (req, res) => {
    let body = req.body;
    let username = body.username;
    let password = await bcrypt.hash(body.password, 10);

    let user = new User({
        username: username,
        password: password,
        name: body.name,
        isSupreme: false
    });

    try {
        await user.save();
        res.redirect("users");
    } catch (err) {
        if (err.code == 11000) {
            res.render("add/add-user", { message: "Username is Taken" });
        } else {
            res.send(err);
        };
    };
});

router.get("/add-member", checkSupreme, (req, res) => {
    res.render("add/add-member");
});
router.post("/add-member", checkSupreme, upload.single("img"), async (req, res) => {
    // Compress
    await sharp(req.file.filename).toFormat("jpeg").jpeg({ quality: 5, force: true }).toFile("toConvert.jpg");
    let filename = `${uuid.v4()}-${Date.now()}.jpg`;
    const writeStream = gfs.createWriteStream(filename);
    await fs.createReadStream(`./toConvert.jpg`).pipe(writeStream);
    fs.unlink("toConvert.jpg", (err) => {
        if (err) {
            res.send(err);
        };
    });
    fs.unlink(`${req.file.filename}`, (err) => {
        if (err) {
            res.send(err);
        };
    });

    let body = req.body;

    let sPlatforms = body.socialPlatform;
    let sURL = body.socialURL;
    let socials = [];

    if (Array.isArray(sPlatforms)) {
        for (let i = 0; i < sPlatforms.length; i++) {
            let social = {
                platform: sPlatforms[i],
                URL: sURL[i]
            };
            socials.push(social);
        }
    } else {
        socials = [{
            platform: sPlatforms,
            URL: sURL
        }];
    };

    let member = new Member({
        name: body.name,
        event: body.event,
        socials: socials,
        image: filename
    });

    try {
        await member.save();
        res.redirect("/admin/members");
    } catch (err) {
        res.send(err);
    };
});

router.get("/add-alumni", checkSupreme, (req, res) => {
    res.render("add/add-alumni");
});
router.post("/add-alumni", checkSupreme, upload.single("img"), async (req, res) => {
    // Compress
    await sharp(req.file.filename).toFormat("jpeg").jpeg({ quality: 5, force: true }).toFile("toConvert.jpg");
    let filename = `${uuid.v4()}-${Date.now()}.jpg`;
    const writeStream = gfs.createWriteStream(filename);
    await fs.createReadStream(`./toConvert.jpg`).pipe(writeStream);
    fs.unlink("toConvert.jpg", (err) => {
        if (err) {
            res.send(err);
        };
    });
    fs.unlink(`${req.file.filename}`, (err) => {
        if (err) {
            res.send(err);
        };
    });

    let body = req.body;

    let sPlatforms = body.socialPlatform;
    let sURL = body.socialURL;
    let socials = [];

    if (Array.isArray(sPlatforms)) {
        for (let i = 0; i < sPlatforms.length; i++) {
            let social = {
                platform: sPlatforms[i],
                URL: sURL[i]
            };
            socials.push(social);
        }
    } else {
        socials = [{
            platform: sPlatforms,
            URL: sURL
        }];
    };

    let alumni = new Alumni({
        name: body.name,
        post: body.post,
        year: body.year,
        current: body.current,
        socials: socials,
        image: filename
    });

    try {
        await alumni.save();
        res.redirect("/admin/alumnis");
    } catch (err) {
        res.send(err);
    };
});

router.get("/add-contact", checkSupreme, (req, res) => {
    res.render("add/add-contact");
});
router.post("/add-contact", checkSupreme, async (req, res) => {
    let contact = new Contact({
        post: req.body.post,
        mail: req.body.mail
    });

    try {
        contact.save();
        res.redirect("/admin/contacts");
    } catch (err) {
        res.send(err);
    };
});

// DELETE
router.get("/delete-user/:id", checkSupreme, async (req, res) => {
    await User.deleteOne({ _id: req.params.id });
    res.redirect("/admin/users");
});
router.get("/delete-member/:id", checkSupreme, async (req, res) => {
    let member = await Member.findById(req.params.id);
    gfs.remove({ filename: member.image, root: "fs" }, async (err, gridStore) => {
        if (err) {
            res.send(err);
        } else {
            await Member.deleteOne({ _id: req.params.id });
            res.redirect("/admin/members");
        };
    });
});
router.get("/delete-alumni/:id", checkSupreme, async (req, res) => {
    let alumni = await Alumni.findById(req.params.id);
    gfs.remove({ filename: alumni.image, root: "fs" }, async (err, gridStore) => {
        if (err) {
            res.send(err);
        } else {
            await Alumni.deleteOne({ _id: req.params.id });
            res.redirect("/admin/alumnis");
        };
    });
});
router.get("/delete-contact/:id", checkSupreme, async (req, res) => {
    await Contact.deleteOne({ _id: req.params.id });
    res.redirect("/admin/contacts");
});

// EDIT
router.get("/edit-profile", async (req, res) => {
    let user = await User.findById(req.user.id);
    res.render("edit/edit-profile", { user: user, message: false });
});
router.put("/edit-profile", async (req, res) => {
    let body = req.body;
    let user = await User.findById(req.user.id);

    try {
        if (await bcrypt.compare(body.oldPassword, req.user.password)) {
            let hashedPassword = await bcrypt.hash(body.password, 10);
            let username = body.username;
            let password = hashedPassword;

            await User.updateOne({ _id: req.user.id }, {
                $set: {
                    username: username,
                    password: password,
                }
            });
            res.redirect("/admin");
        } else {
            res.render("edit/edit-profile", { user: user, message: "Incorrect Password" });
        };
    } catch (err) {
        res.send(err);
    };

});

router.get("/change-name", checkSupreme, async (req, res) => {
    let user = await User.findById(req.user.id);
    res.render("edit/change-name", { user: user });
});
router.put("/change-name", checkSupreme, async (req, res) => {
    try {
        await User.updateOne({ _id: req.user.id }, {
            $set: {
                name: req.body.name
            }
        });
    } catch (err) {
        res.send(err);
    };

    res.redirect("/admin");
});

router.get("/edit-user/:id", checkSupreme, async (req, res) => {
    let user = await User.findById(req.params.id);
    res.render("edit/edit-user", { user: user });
});
router.put("/edit-user/:id", checkSupreme, async (req, res) => {
    await User.updateOne({ _id: req.params.id }, {
        $set: {
            name: req.body.name
        }
    });
    res.redirect("/admin/users")
});

router.get("/edit-member/:id", checkSupreme, async (req, res) => {
    let member = await Member.findById(req.params.id);
    res.render("edit/edit-member", { member: member });
});
router.put("/edit-member/:id", checkSupreme, upload.single("img"), async (req, res) => {
    let body = req.body;
    let sPlatforms = body.socialPlatform;
    let sURL = body.socialURL;
    let socials = [];

    if (Array.isArray(sPlatforms)) {
        for (let i = 0; i < sPlatforms.length; i++) {
            let social = {
                platform: sPlatforms[i],
                URL: sURL[i]
            };
            socials.push(social);
        }
    } else {
        socials = [{
            platform: sPlatforms,
            URL: sURL
        }];
    };

    try {
        if (req.file) {
            // Compress
            await sharp(req.file.filename).toFormat("jpeg").jpeg({ quality: 5, force: true }).toFile("toConvert.jpg");
            let filename = `${uuid.v4()}-${Date.now()}.jpg`;
            const writeStream = gfs.createWriteStream(filename);
            await fs.createReadStream(`./toConvert.jpg`).pipe(writeStream);
            fs.unlink("toConvert.jpg", (err) => {
                if (err) {
                    res.send(err);
                };
            });
            fs.unlink(`${req.file.filename}`, (err) => {
                if (err) {
                    res.send(err);
                };
            });

            let member = await Member.findById(req.params.id);
            gfs.remove({ filename: member.image, root: "fs" }, async (err, gridStore) => {
                if (err) {
                    res.send(err);
                } else {
                    await Member.updateOne({ _id: req.params.id }, {
                        $set: {
                            name: body.name,
                            event: body.event,
                            socials: socials,
                            image: filename
                        }
                    });
                };
            });
        } else {
            await Member.updateOne({ _id: req.params.id }, {
                $set: {
                    name: body.name,
                    event: body.event,
                    socials: socials,
                }
            });
        };
    } catch (errr) {
        res.send(errr);
    };
    res.redirect("/admin/members");
});

router.get("/edit-alumni/:id", checkSupreme, async (req, res) => {
    let alumni = await Alumni.findById(req.params.id);
    res.render("edit/edit-alumni", { alumni: alumni });
});
router.put("/edit-alumni/:id", checkSupreme, upload.single("img"), async (req, res) => {
    let body = req.body;

    let sPlatforms = body.socialPlatform;
    let sURL = body.socialURL;
    let socials = [];

    if (Array.isArray(sPlatforms)) {
        for (let i = 0; i < sPlatforms.length; i++) {
            let social = {
                platform: sPlatforms[i],
                URL: sURL[i]
            };
            socials.push(social);
        }
    } else {
        socials = [{
            platform: sPlatforms,
            URL: sURL
        }];
    };

    try {
        if (req.file) {
            // Compress
            await sharp(req.file.filename).toFormat("jpeg").jpeg({ quality: 5, force: true }).toFile("toConvert.jpg");
            let filename = `${uuid.v4()}-${Date.now()}.jpg`;
            const writeStream = gfs.createWriteStream(filename);
            await fs.createReadStream(`./toConvert.jpg`).pipe(writeStream);
            fs.unlink("toConvert.jpg", (err) => {
                if (err) {
                res.send(err);
                };
            });
            fs.unlink(`${req.file.filename}`, (err) => {
                if (err) {
                res.send(err);
                };
            });

            let alumni = await Alumni.findById(req.params.id);
            gfs.remove({ filename: alumni.image, root: "fs" }, async (err, gridStore) => {
                if (err) {
                    res.send(err);
                } else {
                    await Alumni.updateOne({ _id: req.params.id }, {
                        $set: {
                            name: body.name,
                            post: body.post,
                            socials: socials,
                            year: body.year,
                            current: body.current,
                            image: filename
                        }
                    });
                };
            });
        } else {
            await Alumni.updateOne({ _id: req.params.id }, {
                $set: {
                    name: body.name,
                    post: body.post,
                    socials: socials,
                    year: body.year,
                    current: body.current
                }
            });
        }
    } catch (err) {
        res.send(err);
    };
    res.redirect("/admin/alumnis");
});

router.get("/edit-contact/:id", checkSupreme, async (req, res) => {
    let contact = await Contact.findById(req.params.id);
    res.render("edit/edit-contact", { contact: contact });
});
router.put("/edit-contact/:id", checkSupreme, async (req, res) => {
    await Contact.updateOne({ _id: req.params.id }, {
        $set: {
            post: req.body.post,
            mail: req.body.mail
        }
    });
    res.redirect("/admin/contacts");
});

// MIDDLEWARE
async function checkSupreme(req, res, next) {
    let user = await User.findById(req.user.id);
    if (user.isSupreme) {
        next();
    } else {
        res.redirect("/admin");
    };
};

module.exports = router;
