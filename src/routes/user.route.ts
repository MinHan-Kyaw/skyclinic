import { Application, NextFunction, Request, Response } from "express";
import { autoInjectable } from "tsyringe";
import { UserServices } from "../services/user.service";
import { RegistrationServices } from "../services/registration.service";
import {
  successresponse,
  failureresponse,
  insufficientparameters,
} from "../services/common.service";
import fs = require("fs");
import swaggerUi from "swagger-ui-express";
import passport from "passport";
import { authorize } from "../middlewares/authorize";
import Roles from "../common/roles";
import multer = require("multer");
import { AppReqUser, AppSignInUser, AppUserOTP } from "../models/appuser.model";

@autoInjectable()
export default class Routes {
  user_service: UserServices;
  registration_servie: RegistrationServices;
  constructor(
    user_service: UserServices,
    registration_servie: RegistrationServices
  ) {
    this.user_service = user_service;
    this.registration_servie = registration_servie;
  }
  // private user_service: Services = new Services();
  /* Swagger files start */
  private swaggerFile: any = process.cwd() + "/swagger.json";
  private swaggerData: any = fs.readFileSync(this.swaggerFile, "utf8");
  private swaggerDocument = JSON.parse(this.swaggerData);

  public route(app: Application) {
    //create sign up route
    app.post("/user/signup", async (req: Request, res: Response) => {
      const data = await this.registration_servie.signup(req.body as unknown as AppReqUser);
      if (data.status == "success") {
        res.status(200).json({
          status: "SUCCESS",
          message: "Signed up successfully",
          data: data.data,
        });
      } else if (data.status == "insufficient") {
        insufficientparameters(res);
      } else if (data.status == "invalidname") {
        failureresponse("Username already exists.", data.data, res);
      } else if (data.status == "invalidphone") {
        failureresponse("This phone number already exists.", data.data, res);
      } else {
        failureresponse("Error.", data.data, res);
      }
    });
    //create sign in route
    app.post("/user/signin", async (req: Request, res: Response) => {
      const data = await this.registration_servie.signin(req.body as unknown as AppSignInUser);
      if (data.status == "success") {
        res.status(200).json({
          status: "SUCCESS",
          message: "Sign In successfully",
          data: data.data,
        });
      } else if (data.status == "insufficient") {
        insufficientparameters(res);
      } else if (data.status == "invalid") {
        failureresponse("User not found.", data.data, res);
      } else {
        failureresponse("Error.", data.data, res);
      }
    });
    //sent otp
    app.post(
      "/otp/sent",
      passport.authenticate("jwt", { session: false }),
      async (req: Request, res: Response) => {
        const data = await this.registration_servie.sendotp(req.body as unknown as AppUserOTP);
        if (data.status == "success") {
          res.status(200).json({
            status: "SUCCESS",
            message: "OTP sent successfully.",
            session: data.data,
          });
        } else if (data.status == "insufficient") {
          insufficientparameters(res);
        } else if (data.status == "invalid") {
          failureresponse("User not found.", data.data, res);
        } else if (data.status == "invalidmail") {
          failureresponse("Invalid Email.", data.data, res);
        } else {
          failureresponse("Error.", data.data, res);
        }
      }
    );
    //verify otp
    app.post(
      "/otp/verify",
      passport.authenticate("jwt", { session: false }),
      async (req: Request, res: Response) => {
        const data = await this.registration_servie.verifyotp(req);
        if (data.status == "success") {
          successresponse("Verify OTP successfully.", data.data, res);
        } else if (data.status == "insufficient") {
          insufficientparameters(res);
        } else if (data.status == "invalid") {
          failureresponse("User not found.", data.data, res);
        } else if (data.status == "invalidotp") {
          failureresponse("Invalid OTP.", data.data, res);
        } else {
          failureresponse("Error.", data.data, res);
        }
      }
    );
    //create user update route
    app.post(
      "/user/update",
      multer({ dest: "./uploads/" }).any(),
      // multer({ dest: "./uploads/" }).fields([
      //   { name: "profileimage", maxCount: 1 },
      //   { name: "identifiedphoto_front", maxCount: 1 },
      //   { name: "identifiedphoto_back", maxCount: 1 },
      //   { name: "userid" },
      //   { name: "fullname" },
      //   { name: "othername" },
      //   { name: "email" },
      //   { name: "address" },        
      //   { name: "dob" },
      //   { name: "gender" },
      //   { name: "bloodtype" },
      //   { name: "allergicdrug" },
      //   { name: "cmt" },
      //   { name: "identifiednumber" },
      // ]),
      async (req: Request, res: Response) => {
        passport.authenticate("jwt", { session: false }, async (err, user, info) => {
          if(user){
            const data = await this.user_service.updateskcuser(req);
            if (data.status == "success") {
              successresponse("Updated user successfully.", data.data, res);
            } else if (data.status == "insufficient") {
              insufficientparameters(res);
            } else if (data.status == "unauthorized") {
              failureresponse("Unauthorized.", data.data, res);
            } else if (data.status == "invalid") {
              failureresponse("User not found.", data.data, res);
            } else if (data.status == "invalidimg") {
              failureresponse("Not allowed file type.", data.data, res);
            } else {
              failureresponse("Error.", data.data, res);
            }
          }
          else{
            failureresponse("Unauthorized.", {}, res);
          }
        })(req,res);
      }
    );
    //create get all users route
    app.post(
      "/user/getall",
      passport.authenticate("jwt", { session: false }),
      authorize(Roles.ADMIN),
      async (req: Request, res: Response) => {
        const data = await this.user_service.getall(req);
        if (data.status == "success") {
          successresponse("Get User successfully", data.data, res);
        } else if (data.status == "insufficient") {
          insufficientparameters(res);
        } else if (data.status == "unauthorized") {
          failureresponse("Unauthorized.", data.data, res);
        } else if (data.status == "invalid") {
          failureresponse("User not found.", data.data, res);
        } else {
          failureresponse("Error.", data.data, res);
        }
      }
    );
    //create get user route
    app.post(
      "/user/getdetail",
      passport.authenticate("jwt", { session: false }),
      async (req: Request, res: Response) => {
        const data = await this.user_service.getdetail(req);
        if (data.status == "success") {
          successresponse("Get User successfully", data.data, res);
        } else if (data.status == "insufficient") {
          insufficientparameters(res);
        } else if (data.status == "unauthorized") {
          failureresponse("Unauthorized.", data.data, res);
        } else if (data.status == "invalid") {
          failureresponse("User not found.", data.data, res);
        } else {
          failureresponse("Error.", data.data, res);
        }
      }
    );
    //create user delete route
    app.post(
      "/user/delete",
      passport.authenticate("jwt", { session: false }),
      async (req: Request, res: Response) => {
        const data = await this.user_service.deleteskcuser(req);
        if (data.status == "success") {
          successresponse("Deleted User successfully", data.data, res);
        } else if (data.status == "insufficient") {
          insufficientparameters(res);
        } else if (data.status == "unauthorized") {
          failureresponse("Unauthorized.", data.data, res);
        } else if (data.status == "invalid") {
          failureresponse("User not found.", data.data, res);
        } else if (data.status == "cannotdelete") {
          failureresponse("Can not delete user.", data.data, res);
        } else {
          failureresponse("Error.", data.data, res);
        }
      }
    );
    //create documentation route for api
    app.use(
      "/api/docs",
      swaggerUi.serve,
      swaggerUi.setup(this.swaggerDocument)
    );
  }
}
