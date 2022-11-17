import { NextFunction, Request, Response } from "express";
import { failureresponse } from "../services/common.service";
import AesEncryption from "../common/aesEncryption";
// middleware for doing role-based permissions
export const authorize = (permittedRoles : string) => {
    // return a middleware
    return (request : Request, response: Response, next : NextFunction) => {
      if(request.user){
        console.log(AesEncryption.encrypt(permittedRoles))
        console.log(request.user)
        if (AesEncryption.encrypt(permittedRoles) == request.user) {
          next(); // role is allowed, so continue on the next middleware
        } else {
          failureresponse("Unauthroized Access.", {}, response);
        }
      }
      else{
        failureresponse("Error", {}, response);
      }
    }
  }