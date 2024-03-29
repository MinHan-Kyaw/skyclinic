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
import { IDoctorInput, ILinkClinic } from "../models/doctor.model";

@autoInjectable()
export default class Routes {
  doctor_service: DoctorServices;
  constructor(
    doctor_service: DoctorServices,
  ) {
    this.doctor_service = doctor_service;
  }

  public route(app: Application) {
    //create doctor setup route
    app.post(
      "/doctor/setup",
      multer({ dest: "./uploads/" }).any(),
      async (req: Request, res: Response) => {
        passport.authenticate(
          "jwt",
          { session: false },
          async (err, user, info) => {
            if (user) {
              const data = await this.doctor_service.setupdoctor(req.body as IDoctorInput, req.files);
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

    // Update doctor info
    app.post(
      "/doctor/update",
      multer({ dest: "./uploads/" }).any(),
      async (req: Request, res: Response) => {
        passport.authenticate(
          "jwt",
          { session: false },
          async (err, user, info) => {
            if (user) {
              const data = await this.doctor_service.updatedoctor(req.body as IDoctorInput, req.files);
              if (data.status == "success") {
                successresponse("Get doctor successfully.", data.data, res);
              } else if (data.status == "insufficient") {
                insufficientparameters(res);
              } else if (data.status == "unauthorized") {
                failureresponse("Unauthorized.", data.data, res);
              } else if (data.status == "invalid") {
                failureresponse("User not found.", data.data, res);
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

    // Get doctor info
    app.post(
      "/doctor/get",
      async (req: Request, res: Response) => {
        passport.authenticate(
          "jwt",
          { session: false },
          async (err, user, info) => {
            if (user) {
              const { userid } = req.body;
              const data = await this.doctor_service.getdoctor(userid);
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

    // link doctor to clinic
    app.post(
      "/doctor/linkclinic",
      async (req: Request, res: Response) => {
        passport.authenticate(
          "jwt",
          { session: false },
          async (err, user, info) => {
            if (user) {
              const data = await this.doctor_service.linkclinic(req.body as ILinkClinic);
              if (data.status == "success") {
                successresponse("Link clinic successfully.", data.data, res);
              } else if (data.status == "insufficient") {
                insufficientparameters(res);
              } else if (data.status == "unauthorized") {
                failureresponse("Unauthorized.", data.data, res);
              } else if (data.status == "invalidclinic") {
                failureresponse("Clinic not found.", data.data, res);
              } else if (data.status == "invaliddoctor") {
                failureresponse("Doctor not found.", data.data, res);
              } else if (data.status == "exist") {
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

    // get doctor clinics
    app.post(
      "/doctor/getclinic",
      async (req: Request, res: Response) => {
        passport.authenticate(
          "jwt",
          { session: false },
          async (err, user, info) => {
            if (user) {
              const { userid } = req.body;
              const data = await this.doctor_service.getclinic(userid);
              if (data.status == "success") {
                successresponse("Get clinic successfully.", data.data, res);
              } else if (data.status == "insufficient") {
                insufficientparameters(res);
              } else if (data.status == "unauthorized") {
                failureresponse("Unauthorized.", data.data, res);
              } else if (data.status == "invalidclinic") {
                failureresponse("Clinic not found.", data.data, res);
              } else if (data.status == "invaliddoctor") {
                failureresponse("Doctor not found.", data.data, res);
              } else if (data.status == "exist") {
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
