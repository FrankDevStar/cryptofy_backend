const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const { INIT_POWER } = require("../Utils/utils");
var VerifyCodeList = {};
var {
  isExistUserByEmail,
  isExistUserByIP,
  addUser,
  getUserData,
  getUserDataByEmail,
  getUserAddress,
  updateUserSeenTime,
  updateUserEmailVerify,
  getUserDetails,
  getRegisterPower,
  getContactEmail,
  limitedTime,
} = require("../Models/user.js");
const { createReward } = require("../Models/Reward.js");

var { createAccount } = require("../Web3/web3.js");
const { createPower, getStackedPlan } = require("../Models/Mining.js");

const userRegister = async (req, res) => {
  const clientIp = req.clientIp?.replace("::ffff:", "");
  const { email, password, referral } = req.body;

  try {
    const isExist = await isExistUserByIP(clientIp);
    const isExistEmail = await isExistUserByEmail(email);
    console.log(isExistEmail);
    if (isExistEmail == false) {
      if (email && password) {
        const passwordHash = await bcrypt.hash(password, 10);
        const username = email.split("@")[0];
        wallet = await createAccount();

        //add new user record
        const newUserID = await addUser(
          username,
          email,
          passwordHash,
          clientIp,
          wallet.address,
          wallet.privatekey,
          referral
        );
        console.log(newUserID);
        if (newUserID > 0) {
          const registeration_power = await getRegisterPower();
          await createReward(
            "registeration",
            0,
            registeration_power,
            newUserID
          );
          await createPower(newUserID, registeration_power);
          //get user's information
          const userinfo = await getUserData(newUserID);

          //generate token for new user
          const token = jwt.sign(
            {
              userId: newUserID,
            },
            process.env.jwtSecret
          );
          res.status(200).json({
            result: "success",
            token: token,
            user_info: userinfo,
          });
        } else {
          res.status(400).json({
            result: "failed",
            msg: "Create Error",
          });
        }
      } else {
        res.status(400).json({
          result: "failed",
          msg: "invalid request.",
        });
      }
    } else {
      res.status(400).json({
        result: "failed",
        msg: "User already exist.",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({
      result: "failed",
      msg: "Server Error",
    });
  }
};
const userLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const isExist = await isExistUserByEmail(email);
    if (isExist) {
      const userinfo = await getUserDataByEmail(email);
      const matchPassword = await bcrypt.compare(password, userinfo.password);
      if (matchPassword) {
        if (userinfo.state == 1) {
          await updateUserSeenTime(userinfo.id);
          //generate token for new user
          const token = jwt.sign(
            {
              userId: userinfo.id,
            },
            process.env.jwtSecret
          );
          res.status(200).json({
            result: "success",
            token: token,
            user_info: userinfo,
          });
        } else {
          res.status(400).json({
            result: "failed",
            msg: "You are suspended.",
          });
        }
      } else {
        res.status(400).json({
          result: "failed",
          msg: "password is wrong.",
        });
      }
    } else {
      res.status(400).json({
        result: "failed",
        msg: "Email is inValid",
      });
    }
  } catch (err) {
    res.status(400).json({
      result: "failed",
      msg: "Server Error",
    });
  }
};

const userAddress = async (req, res) => {
  try {
    const user_id = req.user;
    const address = await getUserAddress(user_id);
    res.status(200).json({
      result: "success",
      address: address,
    });
  } catch (err) {
    res.status(400).json({
      result: "failed",
      msg: "Server Error",
    });
  }
};

const sendCode = async (req, res) => {
  try {
    const user_id = req.user;
    const userinfo = await getUserData(user_id);
    const email = userinfo.email;

    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "ruka0430petri@gmail.com",
        pass: "nnkkclzckscepylm",
      },
    });
    var code = Math.floor(Math.random() * 10000000) % 1000000;
    if (code < 100000) code = code * 10;
    console.log(email, code);
    VerifyCodeList[email] = code;
    var mailOptions = {
      from: "ruka0430petri@gmail.com",
      to: email,
      subject: "Verify Code",
      html: `<html>
          <h2>${code}</h2>
                </html>`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error, "mail send error");
      } else {
        console.log("Email sent: " + info.response);
      }
    });
    res.status(200).json({
      result: "success",
    });
  } catch (err) {
    res.status(400).json({
      result: "failed",
      msg: "Server Error",
    });
  }
};

const confirmCode = async (req, res) => {
  const { code } = req.body;
  const user_id = req.user;
  const userinfo = await getUserData(user_id);
  const email = userinfo.email;
  console.log(email, code, VerifyCodeList[email]);
  if (parseInt(VerifyCodeList[email]) == code) {
    await updateUserEmailVerify(userinfo.id);
    res.status(200).json({
      result: "success",
    });
  } else {
    res.status(400).json({
      result: "failed",
      msg: "Code is wrong.",
    });
  }
};

const getDetails = async (req, res) => {
  try {
    const user_id = req.user;
    const result = await getUserDetails(user_id);

    const staking_earned = result["staking_earned"];
    const affiliate_earned = result["affiliate_earned"];
    const data = await getStackedPlan(user_id);
    res.status(200).json({
      result: "success",
      earned: staking_earned + affiliate_earned,
      staked: data,
    });
  } catch (err) {
    res.status(400).json({
      result: "failed",
      msg: "Server Error",
    });
  }
};

const sendContacts = async (req, res) => {
  const { name, email, subject, message } = req.body;
  try {
    const user_id = req.user;
    const contactEmail = await getContactEmail();
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "ruka0430petri@gmail.com",
        pass: "nnkkclzckscepylm",
      },
    });
    console.log(contactEmail["email1"]);
    var mailOptions = {
      from: "ruka0430petri@gmail.com",
      to: contactEmail["email1"],
      subject: "Verify Code",
      html: `<html>
                <body>
                  <center>
                    <p>From ${name}</p>  
                    <h2>${subject}</h2>
                    <p>${message}</p>
                    <p>${email}</p>    
                  </center>
                </body>         
           </html>`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error, "mail send error");
        res.status(400).json({
          result: "failed",
          msg: "Server Error",
        });
        return;
      } else {
        console.log("Email sent: " + info.response);
      }
    });
    res.status(200).json({
      result: "success",
    });
  } catch (err) {
    res.status(400).json({
      result: "failed",
      msg: "Server Error",
    });
  }
};
const getLimitedTime = async (req, res) => {
  try {
    const user_id = req.user;
    const result = await limitedTime(user_id);
    res.status(200).json({
      result: "success",
      data: result,
    });
  } catch (err) {
    res.status(400).json({
      result: "failed",
      msg: "Server Error",
    });
  }
};
module.exports = {
  userRegister,
  userLogin,
  userAddress,
  sendCode,
  confirmCode,
  getDetails,
  sendContacts,
  getLimitedTime,
};
