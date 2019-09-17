import crypto from "crypto";
import _ from "lodash";
import mailChecker from "mailchecker";
import nodemailer from "nodemailer";
import passport from "passport";
import { promisify } from "util";
import validator from "validator";
import { User } from "../models/User";

const randomBytesAsync = promisify(crypto.randomBytes);

/**
 * GET /account
 * Profile page.
 */
export function getAccount(req, res) {
  res.render("account/profile", {
    title: "Account Management"
  });
}

/**
 * POST /account/profile
 * Update profile information.
 */
export async function postUpdateProfile(req, res, next) {
  const validationErrors: any = [];
  if (!validator.isEmail(req.body.email)) {
    validationErrors.push({ msg: "Please enter a valid email address." });
  }

  if (validationErrors.length) {
    req.flash("errors", validationErrors);
    return res.redirect("/account");
  }
  req.body.email = validator.normalizeEmail(req.body.email, {
    gmail_remove_dots: false
  });

  const user = await User.findById(req.user.id).exec(e => next(e));
  if (user) {
    if (user.email !== req.body.email) {
      user.emailVerified = false;
      user.email = req.body.email || "";
      user.name = req.body.name || "";
      user.gender = req.body.gender || "";
      user.location = req.body.location || "";
      user.website = req.body.website || "";
      user.save(err => {
        if (err) {
          if (err.code === 11000) {
            req.flash("errors", {
              msg:
                "The email address you have entered is already associated with an account."
            });
            return res.redirect("/account");
          }
          return next(err);
        }
        req.flash("success", { msg: "Profile information has been updated." });
        res.redirect("/account");
      });
    }
  } else {
    next();
  }
}

/**
 * POST /account/password
 * Update current password.
 */
export async function postUpdatePassword(req, res, next) {
  const validationErrors: any = [];
  if (!validator.isLength(req.body.password, { min: 8 })) {
    validationErrors.push({
      msg: "Password must be at least 8 characters long"
    });
  }
  if (req.body.password !== req.body.confirmPassword) {
    validationErrors.push({ msg: "Passwords do not match" });
  }

  if (validationErrors.length) {
    req.flash("errors", validationErrors);
    return res.redirect("/account");
  }

  const user = await User.findById(req.user.id).exec(e => next(e));
  if (user) {
    user.password = req.body.password;
    user.save(err => {
      if (err) {
        return next(err);
      }
      req.flash("success", { msg: "Password has been changed." });
      res.redirect("/account");
    });
  }
}

/**
 * POST /account/delete
 * Delete user account.
 */
export function postDeleteAccount(req, res, next) {
  User.deleteOne({ _id: req.user.id }, err => {
    if (err) {
      return next(err);
    }
    req.logout();
    req.flash("info", { msg: "Your account has been deleted." });
    res.redirect("/");
  });
}

/**
 * GET /account/verify
 * Verify email address
 */
export async function getVerifyEmail(req, res, next) {
  if (req.user.emailVerified) {
    req.flash("info", { msg: "The email address has been verified." });
    return res.redirect("/account");
  }

  if (!mailChecker.isValid(req.user.email)) {
    req.flash("errors", {
      msg:
        "The email address is invalid or disposable and can not be verified.  Please update your email address and try again."
    });
    return res.redirect("/account");
  }

  const createRandomToken = randomBytesAsync(16).then(buf =>
    buf.toString("hex")
  );

  const setRandomToken = async token => {
    const user = await User.findOne({ email: req.user.email });
    if (user) {
      user.emailVerificationToken = token;
      user.save();
    }
    return token;
  };

  const sendVerifyEmail = token => {
    let transporter = nodemailer.createTransport({
      service: "SendGrid",
      auth: {
        user: process.env.SENDGRID_USER,
        pass: process.env.SENDGRID_PASSWORD
      }
    });
    const mailOptions = {
      to: req.user.email,
      from: "hackathon@starter.com",
      subject: "Please verify your email address on Hackathon Starter",
      text: `Thank you for registering with hackathon-starter.\n\n
          This verify your email address please click on the following link, or paste this into your browser:\n\n
          http://${req.headers.host}/account/verify/${token}\n\n
          \n\n
          Thank you!`
    };
    return transporter
      .sendMail(mailOptions)
      .then(() => {
        req.flash("info", {
          msg: `An e-mail has been sent to ${req.user.email} with further instructions.`
        });
      })
      .catch(err => {
        if (err.message === "self signed certificate in certificate chain") {
          console.log(
            "WARNING: Self signed certificate in certificate chain. Retrying with the self signed certificate. Use a valid certificate if in production."
          );
          transporter = nodemailer.createTransport({
            service: "SendGrid",
            auth: {
              user: process.env.SENDGRID_USER,
              pass: process.env.SENDGRID_PASSWORD
            },
            tls: {
              rejectUnauthorized: false
            }
          });
          return transporter.sendMail(mailOptions).then(() => {
            req.flash("info", {
              msg: `An e-mail has been sent to ${req.user.email} with further instructions.`
            });
          });
        }
        console.log(
          "ERROR: Could not send verifyEmail email after security downgrade.\n",
          err
        );
        req.flash("errors", {
          msg:
            "Error sending the email verification message. Please try again shortly."
        });
        return err;
      });
  };

  createRandomToken
    .then(setRandomToken)
    .then(sendVerifyEmail)
    .then(() => res.redirect("/account"))
    .catch(next);
}

/**
 * GET /account/verify/:token
 * Verify email address
 */
export function getVerifyEmailToken(req, res, next) {
  if (req.user.emailVerified) {
    req.flash("info", { msg: "The email address has been verified." });
    return res.redirect("/account");
  }

  const validationErrors: any = [];
  if (req.params.token && !validator.isHexadecimal(req.params.token)) {
    validationErrors.push({ msg: "Invalid Token.  Please retry." });
  }
  if (validationErrors.length) {
    req.flash("errors", validationErrors);
    return res.redirect("/account");
  }

  if (req.params.token === req.user.emailVerificationToken) {
    User.findOne({ email: req.user.email })
      .then(user => {
        if (!user) {
          req.flash("errors", {
            msg: "There was an error in loading your profile."
          });
          return res.redirect("back");
        }
        user.emailVerificationToken = "";
        user.emailVerified = true;
        user.save();
        req.flash("info", {
          msg: "Thank you for verifying your email address."
        });
        return res.redirect("/account");
      })
      .catch(error => {
        console.log(
          "Error saving the user profile to the database after email verification",
          error
        );
        req.flash("error", {
          msg:
            "There was an error when updating your profile.  Please try again later."
        });
        return res.redirect("/account");
      });
  }
}

/**
 * GET /account/unlink/:provider
 * Unlink OAuth provider.
 */
export async function getOauthUnlink(req, res, next) {
  const { provider } = req.params;
  let user = await User.findById(req.user.id).exec(e => next(e));
  //   , (err, user) => {
  // if (err) {
  //   return next(err);
  // }
  if (user) {
    user[provider.toLowerCase()] = undefined;
    const tokensWithoutProviderToUnlink = user.tokens.filter(
      token => token.kind !== provider.toLowerCase()
    );
    // Some auth providers do not provide an email address in the user profile.
    // As a result, we need to verify that unlinking the provider is safe by ensuring
    // that another login method exists.
    if (
      !(user.email && user.password) &&
      tokensWithoutProviderToUnlink.length === 0
    ) {
      req.flash("errors", {
        msg:
          `The ${_.startCase(
            _.toLower(provider)
          )} account cannot be unlinked without another form of login enabled.` +
          " Please link another account or add an email address and password."
      });
      return res.redirect("/account");
    }
    user.tokens = tokensWithoutProviderToUnlink;
    user.save(err => {
      if (err) {
        return next(err);
      }
      req.flash("info", {
        msg: `${_.startCase(_.toLower(provider))} account has been unlinked.`
      });
      res.redirect("/account");
    });
  }
  //   });
}
