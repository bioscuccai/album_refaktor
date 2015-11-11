var socket=io();
var images=[];
socket.on("connect", function(){
    console.log("connected");
});

socket.on("status_update", function (data) {
    console.log(data);
    //fillTemplate(data);
});

$("#upload-form").on("submit", function (e) {
  e.preventDefault();
  if(!$("#image").val()){
    console.log("empty");
    $(".upload-error").text("The file field cannot be empty!").fadeIn(300);
    return;
  }
  var form = $("#upload-form");
  var albumId = form.data("album-id");
  var formData = new FormData(form[0]);
  $(".upload-error").hide();
  console.log(formData);
  $.ajax({
    url: "/images/upload_for_watcher?album=" + albumId,
    method: "POST",
    data: formData,
    cache: false,
    contentType: false,
    processData: false,
    success: function (rep) {
      console.log("sent");
      console.log(rep);
      socket.emit("image_subscribe", rep.queueId);
    }
  });
});