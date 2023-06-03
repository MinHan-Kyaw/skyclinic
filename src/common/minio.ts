import * as Minio from "minio";
const minioClient = new Minio.Client({
  endPoint: "192.168.100.16",
  port: 9000,
  useSSL: false,
  accessKey: "waiyansoe",
  secretKey: "waiyansoeminioskc",
});

// const minioClient = new Minio.Client({
//     endPoint:  's3.amazonaws.com',
//     accessKey: 'AKIAWUG7TFMMHKWJSZUA',
//     secretKey: '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',
//     region: 'ap-southeast-1'
// })

export default minioClient;