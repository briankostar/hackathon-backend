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
 * GET /login
 * Login page.
 */
export function getLogin(req, res) {
  if (req.user) {
    return res.redirect("/");
  }
  res.render("account/login", {
    title: "Login"
  });
}

/**
 * POST /login
 * Sign in using email and password.
 */
export function postLogin(req, res, next) {
  const validationErrors: any = [];
  if (!validator.isEmail(req.body.email)) {
    validationErrors.push({ msg: "Please enter a valid email address." });
  }
  if (validator.isEmpty(req.body.password)) {
    validationErrors.push({ msg: "Password cannot be blank." });
  }

  if (validationErrors.length) {
    req.flash("errors", validationErrors);
    return res.redirect("/login");
  }
  req.body.email = validator.normalizeEmail(req.body.email, {
    gmail_remove_dots: false
  });

  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash("errors", info);
      return res.redirect("/login");
    }
    req.logIn(user, err => {
      if (err) {
        return next(err);
      }
      req.flash("success", { msg: "Success! You are logged in." });
      res.redirect(req.session.returnTo || "/");
    });
  })(req, res, next);
}

/**
 * GET /logout
 * Log out.
 */
export function logout(req, res) {
  req.logout();
  req.session.destroy(err => {
    if (err) {
      console.log("Error : Failed to destroy the session during logout.", err);
    }
    req.user = null;
    res.redirect("/");
  });
}

/**
 * GET /forgot
 * Forgot Password page.
 */
export function getForgot(req, res) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  res.render("account/forgot", {
    title: "Forgot Password"
  });
}

/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 */
export async function postForgot(req, res, next) {
  const validationErrors: any = [];
  if (!validator.isEmail(req.body.email)) {
    validationErrors.push({ msg: "Please enter a valid email address." });
  }

  if (validationErrors.length) {
    req.flash("errors", validationErrors);
    return res.redirect("/forgot");
  }
  req.body.email = validator.normalizeEmail(req.body.email, {
    gmail_remove_dots: false
  });

  const createRandomToken = randomBytesAsync(16).then(buf =>
    buf.toString("hex")
  );

  const setRandomToken = async token => {
    let user = await User.findOne({ email: req.body.email }).exec(e => next(e));
    if (!user) {
      req.flash("errors", {
        msg: "Account with that email address does not exist."
      });
    } else {
      user.passwordResetToken = token;
      user.passwordResetExpires = new Date(new Date().getTime() + 60 * 60000); // add 60 min
      user = await user.save();
      return user;
    }
  };

  const sendForgotPasswordEmail = user => {
    if (!user) {
      return;
    }
    const token = user.passwordResetToken;
    let transporter = nodemailer.createTransport({
      service: "SendGrid",
      auth: {
        user: process.env.SENDGRID_USER,
        pass: process.env.SENDGRID_PASSWORD
      }
    });
    const mailOptions = {
      to: user.email,
      from: "hackathon@starter.com",
      subject: "Reset your password on Hackathon Starter",
      text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
          Please click on the following link, or paste this into your browser to complete the process:\n\n
          http://${req.headers.host}/reset/${token}\n\n
          If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };
    return transporter
      .sendMail(mailOptions)
      .then(() => {
        req.flash("info", {
          msg: `An e-mail has been sent to ${user.email} with further instructions.`
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
              msg: `An e-mail has been sent to ${user.email} with further instructions.`
            });
          });
        }
        console.log(
          "ERROR: Could not send forgot password email after security downgrade.\n",
          err
        );
        req.flash("errors", {
          msg:
            "Error sending the password reset message. Please try again shortly."
        });
        return err;
      });
  };

  createRandomToken
    .then(setRandomToken)
    .then(sendForgotPasswordEmail)
    .then(() => res.redirect("/forgot"))
    .catch(next);
}

/**
 * GET /reset/:token
 * Reset Password page.
 */
export function getReset(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  const validationErrors: any = [];
  if (!validator.isHexadecimal(req.params.token)) {
    validationErrors.push({ msg: "Invalid Token.  Please retry." });
  }
  if (validationErrors.length) {
    req.flash("errors", validationErrors);
    return res.redirect("/forgot");
  }

  User.findOne({ passwordResetToken: req.params.token })
    .where("passwordResetExpires")
    .gt(Date.now())
    .exec((err, user) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        req.flash("errors", {
          msg: "Password reset token is invalid or has expired."
        });
        return res.redirect("/forgot");
      }
      res.render("account/reset", {
        title: "Password Reset"
      });
    });
}

/**
 * POST /reset/:token
 * Process the reset password request.
 */
export function postReset(req, res, next) {
  const validationErrors: any = [];
  if (!validator.isLength(req.body.password, { min: 8 })) {
    validationErrors.push({
      msg: "Password must be at least 8 characters long"
    });
  }
  if (req.body.password !== req.body.confirm) {
    validationErrors.push({ msg: "Passwords do not match" });
  }
  if (!validator.isHexadecimal(req.params.token)) {
    validationErrors.push({ msg: "Invalid Token.  Please retry." });
  }

  if (validationErrors.length) {
    req.flash("errors", validationErrors);
    return res.redirect("back");
  }

  const resetPassword = async () => {
    let user = await User.findOne({ passwordResetToken: req.params.token })
      .where("passwordResetExpires")
      .gt(Date.now())
      .exec(e => next(e));

    //   .then(user => {
    if (!user) {
      req.flash("errors", {
        msg: "Password reset token is invalid or has expired."
      });
      return res.redirect("back");
    } else {
      user.password = req.body.password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      user = await user.save();
      //     .then(
      //     () =>
      //       new Promise((resolve, reject) => {
      //         req.logIn(user, err => {
      //           if (err) {
      //             return reject(err);
      //           }
      //           resolve(user);
      //         });
      //       })
      //   );
    }
    //   });
  };

  const sendResetPasswordEmail = user => {
    if (!user) {
      return;
    }
    let transporter = nodemailer.createTransport({
      service: "SendGrid",
      auth: {
        user: process.env.SENDGRID_USER,
        pass: process.env.SENDGRID_PASSWORD
      }
    });
    const mailOptions = {
      to: user.email,
      from: "hackathon@starter.com",
      subject: "Your Hackathon Starter password has been changed",
      text: `Hello,\n\nThis is a confirmation that the password for your account ${user.email} has just been changed.\n`
    };
    return transporter
      .sendMail(mailOptions)
      .then(() => {
        req.flash("success", {
          msg: "Success! Your password has been changed."
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
            req.flash("success", {
              msg: "Success! Your password has been changed."
            });
          });
        }
        console.log(
          "ERROR: Could not send password reset confirmation email after security downgrade.\n",
          err
        );
        req.flash("warning", {
          msg:
            "Your password has been changed, however we were unable to send you a confirmation email. We will be looking into it shortly."
        });
        return err;
      });
  };

  resetPassword()
    .then(sendResetPasswordEmail)
    .then(() => {
      if (!res.finished) res.redirect("/");
    })
    .catch(err => next(err));
}

/**
 * GET /signup
 * Signup page.
 */
export function getSignup(req, res) {
  if (req.user) {
    return res.redirect("/");
  }
  res.render("account/signup", {
    title: "Create Account"
  });
}

/**
 * POST /signup
 * Create a new local account.
 */
export function postSignup(req, res, next) {
  const validationErrors: any = [];
  if (!validator.isEmail(req.body.email)) {
    validationErrors.push({ msg: "Please enter a valid email address." });
  }
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
    return res.redirect("/signup");
  }
  req.body.email = validator.normalizeEmail(req.body.email, {
    gmail_remove_dots: false
  });

  const user = new User({
    email: req.body.email,
    password: req.body.password
  });

  User.findOne({ email: req.body.email }, (err, existingUser) => {
    if (err) {
      return next(err);
    }
    if (existingUser) {
      req.flash("errors", {
        msg: "Account with that email address already exists."
      });
      return res.redirect("/signup");
    }
    user.save(err => {
      if (err) {
        return next(err);
      }
      req.logIn(user, err => {
        if (err) {
          return next(err);
        }
        res.redirect("/");
      });
    });
  });
}
