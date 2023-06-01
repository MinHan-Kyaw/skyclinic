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
import { TreatMentService } from "../services/treatment.service";
import formidableMiddleware from 'express-formidable';
import { TreatMentInput } from "../models/treatment.model";

@autoInjectable()
export default class Routes {
  treatment_service: TreatMentService;
  constructor(
    treatment_service: TreatMentService,
  ) {
    this.treatment_service = treatment_service;
  }

  public route(app: Application) {
    //create clinic setup route
    app.post(
      "/treatment/setup",
      multer({ dest: "./uploads/" }).any(),
      async (req: Request, res: Response) => {
        passport.authenticate(
          "jwt",
          { session: false },
          async (err, user, info) => {
            if (user) {
              const data = await this.treatment_service.setuptreatment(req.body as TreatMentInput, req.files);
              if (data.status == "success") {
                successresponse("Created treatment successfully.", data.data, res);
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
