import { BlobServiceClient } from "@azure/storage-blob";
import minioClient from "../common/minio";
import * as fs from "fs"; //for unlink(delete) old image in folder

const connStr =
  "DefaultEndpointsProtocol=https;AccountName=skyclinic;AccountKey=NPrTCQyltQZrlkHYOu57TVguqFFW8Gg5Rr/+Sd/4SsyWVzvPrQaYCPm3SxSm13aTN3A2gC5nnykH+AStWidkkA==;EndpointSuffix=core.windows.net";
const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
const bucketname = "skc";
const endpoint = "http://192.168.1.4:9000/";
// const endpoint = "https://skyclinic.blob.core.windows.net/";
const bucket_url = endpoint + bucketname + "/";


const fileupload = async (
  filepath: string,
  file: any,
  path_to_delete: string = ""
) => {
  if (path_to_delete) {
    // minioClient.removeObject(bucketname, path_to_delete, function (err) {
    //   if (err) {
    //     return false;
    //   }
    // });
  }
    const await_upload = await minioClient.fPutObject(
      bucketname,
      filepath,
      file,
      { "Content-Type": "application/octet-stream" }
    );
  // const containerClient = blobServiceClient.getContainerClient(bucketname);
  // const blockBlobClient = containerClient.getBlockBlobClient(filepath);
  // const await_upload = await blockBlobClient.uploadFile(file);

  fs.unlinkSync(file);
  return await_upload;
};

const getfileurl = (filename: string, filepath: string) => {
  return bucket_url + filepath + "/" + filename;
};

export { fileupload, getfileurl };
