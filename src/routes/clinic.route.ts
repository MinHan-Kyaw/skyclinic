import { Application, NextFunction, Request, Response } from "express";
import { autoInjectable } from "tsyringe";
// import { UserServices } from "../services/user.service";
// import { RegistrationServices } from "../services/registration.service";
import {
  successresponse,
  failureresponse,
  insufficientparameters,
} from "../services/common.service";
import fs = require("fs");
import swaggerUi from "swagger-ui-express";
import passport from "passport";
// import { authorize } from "../middlewares/authorize";
import Roles from "../common/roles";
import multer = require("multer");
import { ClinicServices } from "../services/clinic.service";
import formidableMiddleware from 'express-formidable';
import { ClinicInput, ClinicUpdateInput, IGetClinicModel, ILinkDoctor } from "../models/clinic.model";

@autoInjectable()
export default class Routes {
  clinic_service: ClinicServices;
  constructor(
    clinic_service: ClinicServices,
  ) {
    this.clinic_service = clinic_service;
  }

  public route(app: Application) {
    //create clinic setup route
    app.post(
      "/clinic/setup",
      multer({ dest: "./uploads/" }).any(),
      async (req: Request, res: Response) => {
        passport.authenticate(
          "jwt",
          { session: false },
          async (err, user, info) => {
            if (user) {
              const data = await this.clinic_service.setupclinic(req.body as ClinicInput, req.files);
              if (data.status == "success") {
                successresponse("Created clinic successfully.", data.data, res);
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

    //update clinic route
    app.post(
      "/clinic/update",
      multer({ dest: "./uploads/" }).any(),
      async (req: Request, res: Response) => {
        passport.authenticate(
          "jwt",
          { session: false },
          async (err, user, info) => {
            if (user) {
              const data = await this.clinic_service.updateclinic(req.body as ClinicUpdateInput, req.files);
              if (data.status == "success") {
                successresponse("Updated clinic successfully.", data.data, res);
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
    //create get all clinic route
    app.post(
      "/clinic/getall",
      async (req: Request, res: Response) => {
        passport.authenticate(
          "jwt",
          { session: false },
          async (err, user, info) => {
            if (user) {
              const data = await this.clinic_service.getallclinic();
              if (data.status == "success") {
                successresponse("Get clinic successfully.", data.data, res);
              } else if (data.status == "insufficient") {
                insufficientparameters(res);
              } else if (data.status == "unauthorized") {
                failureresponse("Unauthorized.", data.data, res);
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
    // get clinic by userid
    app.post(
      "/clinic/get",
      async (req: Request, res: Response) => {
        passport.authenticate(
          "jwt",
          { session: false },
          async (err, user, info) => {
            if (user) {
              const {userid} = req.body;
              const data = await this.clinic_service.getclinic(userid);
              if (data.status == "success") {
                successresponse("Get clinic successfully.", data.data, res);
              } else if (data.status == "insufficient") {
                insufficientparameters(res);
              } else if (data.status == "unauthorized") {
                failureresponse("Unauthorized.", data.data, res);
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

    // link doctor to clinic
    app.post(
      "/clinic/linkdoctor",
      async (req: Request, res: Response) => {
        passport.authenticate(
          "jwt",
          { session: false },
          async (err, user, info) => {
            if (user) {
              const data = await this.clinic_service.linkdoctor(req.body as ILinkDoctor);
              if (data.status == "success") {
                successresponse("Link doctor successfully.", data.data, res);
              } else if (data.status == "insufficient") {
                insufficientparameters(res);
              } else if (data.status == "unauthorized") {
                failureresponse("Unauthorized.", data.data, res);
              } else if (data.status == "invalid") {
                failureresponse("Clinic not found.", data.data, res);
              }else if (data.status == "exist") {
                failureresponse("Doctor already exist.", data.data, res);
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
  }
}
