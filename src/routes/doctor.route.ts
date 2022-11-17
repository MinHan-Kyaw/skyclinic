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
import { DoctorServices } from "../services/doctor.service";
import formidableMiddleware from 'express-formidable';

@autoInjectable()
export default class Routes {
  doctor_service: DoctorServices;
  constructor(
    doctor_service: DoctorServices,
  ) {
    this.doctor_service = doctor_service;
  }

  public route(app: Application) {
    //create user update route
    app.post(
      "/doctor/setup",
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
        passport.authenticate(
          "jwt",
          { session: false },
          async (err, user, info) => {
            if (user) {
              const data = await this.doctor_service.setupdoctor(req);
              if (data.status == "success") {
                successresponse("Created doctor successfully.", data.data, res);
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
            } else {
              failureresponse("Unauthorized.", {}, res);
            }
          }
        )(req, res);
      }
    );
    //create get all users route
  }
}
