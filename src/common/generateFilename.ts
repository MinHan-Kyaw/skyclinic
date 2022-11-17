var yg_date_string = new Date().toLocaleString("en-US", {
  timeZone: "Asia/Yangon",
});
const generateFilename = (orginalname: string) => {
  var filetype = orginalname.split('.').pop();
  var filename = orginalname
    .substring(0, orginalname.lastIndexOf('.'))
  var date_ob = new Date(yg_date_string);
  var day = ("0" + date_ob.getDate()).slice(-2);
  var month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  var year = date_ob.getFullYear();
  // var date = year + "-" + month + "-" + day;
  // console.log(date);
  var hours = date_ob.getHours();
  var minutes = date_ob.getMinutes();
  var seconds = date_ob.getSeconds();
  var milliseconds = date_ob.getMilliseconds();
  return  filename.toString() + year.toString() + month.toString() + day.toString() + hours.toString() + minutes.toString() + seconds.toString() + milliseconds.toString() + '.' + filetype;
};

export default generateFilename;
