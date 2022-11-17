import { Strategy, StrategyOptions, ExtractJwt } from "passport-jwt";
import environment from "../../environment";
import AppUserClass from "../models/appuser.model";
import ISKCUserClass from "../models/skcuser.model";

/**
 * StrategyOptions interface
 * Using passport-jwt
 */

const { secretKey, algorithms } = environment.getJWTConfig()

const opts: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  // jwtFromRequest: ExtractJwt.fromBodyField('token'),
  secretOrKey: secretKey,
};

/**
 * Instance Strategy Class
 */
export default new Strategy(opts, async (payload, done) => {

  try {
    const appusermodel = new AppUserClass().model;
    const skcusermodel = new ISKCUserClass().model;
    
    const _userid = payload._userid;

    // validate user exist or not
    const app_user = await appusermodel.findOne({ $or : [{username: _userid}, { phone: _userid}] });
    
    if (app_user && (app_user.username == _userid || app_user.phone == _userid)){
      const skc_user = await skcusermodel.findOne({ appuserid: app_user.appuserid });
      return done(null, skc_user.usertype);
    }
    return done(null, false);
  } catch (error) {
    done(error, false)
  }
});
