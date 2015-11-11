var socket=io();
var images=[];
socket.on("connect", function(){
    console.log("connected");
});

socket.on("status_update", function (data) {
    //console.log(data);
    fillTemplate(data);
});

function fillTemplate(data){
  console.log("template");
  console.log(data);
  if($("#image-state-"+data.queueId).length===0){
    $("#fresh-uploads").append("<div id='image-state-"+data.queueId+"' class='pure-u-1-6 image-state-box'>In queue</div>");
  }
  if(data.status=="in_queue"){
    $("#image-state-"+data.queueId).html("Queued");
  }
  if(data.status=="processing"){
    $("#image-state-"+data.queueId).html("Processing");
  }
  if(data.status=="ERROR"){
    $("#image-state-"+data.queueId).html("<span style='color: red; font-weight: bold'>Error</span>");
  }
  if(data.status=="done") {
    $("#image-state-"+data.queueId).html("<div id='new-image-" + data.id + "'><a href='/images/" + data.id + "'><img src='/images/url/" + data.id + "/thumb' class='fresh-image pure-img'></a></div>");
  }
}

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
      fillTemplate({
        queueId: rep.queueId
      });
      console.log("sent");
      console.log(rep);
      socket.emit("image_subscribe", rep.queueId);
    }
  });
});