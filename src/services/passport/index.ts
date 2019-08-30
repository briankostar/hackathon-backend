import { User } from "../../models/User";

import axios from "axios";
import express from "express";
import _ from "lodash";
import moment from "moment";
import passport, { Profile } from "passport";
import { Strategy as FacebookStrategy } from "passport-facebook";
import {
  OAuth2Strategy as GoogleStrategy,
  VerifyFunction
} from "passport-google-oauth";
import { Strategy as LocalStrategy } from "passport-local";
// import { refresh } from "passport-oauth2-refresh";
const refresh = require("passport-oauth2-refresh");
import { CONFIG } from "src/configs/configs";
import { logger } from "../logger";

/**
 * Sign in using Email and Password.
 */
passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    (email: string, password: string, done: any) => {
      User.findOne({ email: email.toLowerCase() }, (err, user) => {
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false, { msg: `Email ${email} not found.` });
        }
        if (!user.password) {
          return done(null, false, {
            msg:
              "Your account was registered using a sign-in provider. To enable password login, sign in using a provider, and then set a password under your user profile."
          });
        }
        user.schema.methods.comparePassword(
          password,
          (err: Error, isMatch: boolean) => {
            if (err) {
              return done(err);
            }
            if (isMatch) {
              return done(null, user);
            }
            return done(null, false, { msg: "Invalid email or password." });
          }
        );
      });
    }
  )
);

async function facebookCallbackHandler(
  req: any,
  accessToken: any,
  refreshToken: any,
  profile: any,
  done: any
) {
  if (req.user) {
    User.findOne({ facebook: profile.id }, (err, existingUser) => {
      if (err) {
        return done(err);
      }
      if (existingUser) {
        req.flash("errors", {
          msg:
            "There is already a Facebook account that belongs to you. Sign in with that account or delete it, then link it with your current account."
        });
        done(err);
      } else {
        User.findById(req.user.id, (err, user: any) => {
          if (err) {
            return done(err);
          }
          user.facebook = profile.id;
          user.tokens.push({ kind: "facebook", accessToken });
          user.profile.name =
            user.profile.name ||
            `${profile.name.givenName} ${profile.name.familyName}`;
          user.profile.gender = user.profile.gender || profile._json.gender;
          user.profile.picture =
            user.profile.picture ||
            `https://graph.facebook.com/${profile.id}/picture?type=large`;
          user.save((err: Error) => {
            req.flash("info", { msg: "Facebook account has been linked." });
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ facebook: profile.id }, (err, existingUser) => {
      if (err) {
        return done(err);
      }
      if (existingUser) {
        return done(null, existingUser);
      }
      User.findOne({ email: profile._json.email }, (err, existingEmailUser) => {
        if (err) {
          return done(err);
        }
        if (existingEmailUser) {
          req.flash("errors", {
            msg:
              "There is already an account using this email address. Sign in to that account and link it with Facebook manually from Account Settings."
          });
          done(err);
        } else {
          const user = new User();
          user.email = profile._json.email;
          user.facebook = profile.id;
          user.tokens.push({ kind: "facebook", accessToken });
          user.profile.name = `${profile.name.givenName} ${profile.name.familyName}`;
          user.profile.gender = profile._json.gender;
          user.profile.picture = `https://graph.facebook.com/${profile.id}/picture?type=large`;
          user.profile.location = profile._json.location
            ? profile._json.location.name
            : "";
          user.save(err => {
            done(err, user);
          });
        }
      });
    });
  }
}

/**
 * Sign in with Facebook.
 */

const facebookStrategyConfig = new FacebookStrategy(
  {
    clientID: CONFIG.FACEBOOK_ID,
    clientSecret: CONFIG.FACEBOOK_SECRET,
    callbackURL: `${CONFIG.BASE_URL}/auth/facebook/callback`,
    profileFields: ["name", "email", "link", "locale", "timezone", "gender"],
    passReqToCallback: true
  },
  facebookCallbackHandler
);
passport.use(facebookStrategyConfig);

async function googleCallbackHandler(
  req: any,
  accessToken: string,
  refreshToken: string,
  params: any,
  profile: any,
  done: VerifyFunction
) {
  if (req.user) {
    User.findOne({ google: profile.id }, (err, existingUser) => {
      if (err) {
        return done(err);
      }
      if (existingUser && existingUser.id !== req.user.id) {
        req.flash("errors", {
          msg:
            "There is already a Google account that belongs to you. Sign in with that account or delete it, then link it with your current account."
        });
        done(err);
      } else {
        User.findById(req.user.id, (err, user: any) => {
          if (err) {
            return done(err);
          }
          user!.google = profile.id;
          user.tokens.push({
            kind: "google",
            accessToken,
            accessTokenExpires: moment()
              .add(params.expires_in, "seconds")
              .format(),
            refreshToken
          });
          user.profile.name = user.profile.name || profile.displayName;
          user.profile.gender = user.profile.gender || profile._json.gender;
          user.profile.picture = user.profile.picture || profile._json.picture;
          user.save((err: Error) => {
            req.flash("info", { msg: "Google account has been linked." });
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ google: profile.id }, (err, existingUser) => {
      if (err) {
        return done(err);
      }
      if (existingUser) {
        return done(null, existingUser);
      }
      User.findOne(
        { email: profile.emails[0].value },
        (err, existingEmailUser) => {
          if (err) {
            return done(err);
          }
          if (existingEmailUser) {
            req.flash("errors", {
              msg:
                "There is already an account using this email address. Sign in to that account and link it with Google manually from Account Settings."
            });
            done(err);
          } else {
            const user = new User();
            user.email = profile.emails[0].value;
            user.google = profile.id;
            user.tokens.push({
              kind: "google",
              accessToken,
              accessTokenExpires: moment()
                .add(params.expires_in, "seconds")
                .format(),
              refreshToken
            });
            user.profile.name = profile.displayName;
            user.profile.gender = profile._json.gender;
            user.profile.picture = profile._json.picture;
            user.save(err => {
              done(err, user);
            });
          }
        }
      );
    });
  }
}

/**
 * Sign in with Google.
 */
const googleStrategyConfig = new GoogleStrategy(
  {
    clientID: CONFIG.GOOGLE_ID,
    clientSecret: CONFIG.GOOGLE_SECRET,
    callbackURL: "/auth/google/callback",
    passReqToCallback: true
  },
  googleCallbackHandler as any
);
passport.use("google", googleStrategyConfig);
refresh.use("google", googleStrategyConfig);

// passport.serializeUser((user: any, done) => {
//   done(null, user.id);
// });

// passport.deserializeUser((id, done) => {
//   User.findById(id, (err, user) => {
//     done(err, user);
//   });
// });

/**
 * Login Required middleware.
 */
export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

/**
 * Authorization Required middleware.
 */
export function isAuthorized(req: any, res: any, next: any) {
  const provider = req.path.split("/")[2];
  const token = req.user.tokens.find((token: any) => token.kind === provider);
  if (token) {
    // Is there an access token expiration and access token expired?
    // Yes: Is there a refresh token?
    //     Yes: Does it have expiration and if so is it expired?
    //       Yes, Quickbooks - We got nothing, redirect to res.redirect(`/auth/${provider}`);
    //       No, Quickbooks and Google- refresh token and save, and then go to next();
    //    No:  Treat it like we got nothing, redirect to res.redirect(`/auth/${provider}`);
    // No: we are good, go to next():
    if (
      token.accessTokenExpires &&
      moment(token.accessTokenExpires).isBefore(moment().subtract(1, "minutes"))
    ) {
      if (token.refreshToken) {
        if (
          token.refreshTokenExpires &&
          moment(token.refreshTokenExpires).isBefore(
            moment().subtract(1, "minutes")
          )
        ) {
          res.redirect(`/auth/${provider}`);
        } else {
          refresh.requestNewAccessToken(
            `${provider}`,
            token.refreshToken,
            (err: any, accessToken: any, refreshToken: any, params: any) => {
              User.findById(req.user.id, (err, user: any) => {
                user.tokens.some((tokenObject: any) => {
                  if (tokenObject.kind === provider) {
                    tokenObject.accessToken = accessToken;
                    if (params.expires_in)
                      tokenObject.accessTokenExpires = moment()
                        .add(params.expires_in, "seconds")
                        .format();
                    return true;
                  }
                  return false;
                });
                req.user = user;
                user.markModified("tokens");
                user.save((err: Error) => {
                  if (err) console.log(err);
                  next();
                });
              });
            }
          );
        }
      } else {
        res.redirect(`/auth/${provider}`);
      }
    } else {
      next();
    }
  } else {
    res.redirect(`/auth/${provider}`);
  }
}
