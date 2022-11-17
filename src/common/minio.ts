import * as Minio from "minio";
const minioClient = new Minio.Client({
    endPoint: "192.168.1.9",
    port: 9000,
    useSSL: false,
    accessKey: "hwy",
    secretKey: "hwyislitt",
  });

export default minioClient;