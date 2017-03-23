var app = function()
{
    this.materials = {};
};

jQuery.noConflict();

(function(app, $)
{

  app.materials = {
    //Common functionality in all the app
    getImages : (cb) => {
      let loadingIcon = $('.loading-el');
      loadingIcon.addClass('loading-icon');
      $('.ajax-error').addClass('hide');

      $.ajax({
        method: 'GET',
        url: '/images',
        dataType: 'json'
      })
      .fail( function() {
        loadingIcon.removeClass('loading-icon');
        $('.ajax-error').removeClass('hide');
        console.log('Error!');
      })
      .done( function(data) {
        loadingIcon.removeClass('loading-icon');
        data.forEach(function(imgLink, i){
          $('#imageList').append('<li><img src="'+ imgLink +'" id="dragImg'+ i +'" class="img-rounded dragImg" draggable="true" /></li>');
        })

        if(cb) {
          cb();
        }
      });
    }
  }

  // functionality page or sections specific
  //Syntax Note: app.sectionName = function(){}
  //Syntax Note: app.sectionName.functionName = function(args)
  app.upload = { //examples

    uploadNewImg : (btn, newImgs) => {
      // Validate file: empty, image's format, size
      if (newImgs.length === 0){
        $('.upload-error').text('You must upload an image before submit it.');
        return;

      } else if ( newImgs[0].type !== 'image/png' && newImgs[0].type !== 'image/jpeg' ) {
        $('.upload-error').text('Only .png and .jpeg image are allow');
        return;

      } else if ( newImgs[0].size > 1048576) {
        $('.upload-error').text('The image is too big, image size should be max 1MB.');
        return;

      } else {
        // Pre-display the image in the list to have a early user's feedback.
        var reader = new FileReader();
        reader.onload = (e) => {
          $('#imageList').append('<li><img src=" '+ e.target.result +' " class="img-rounded temporary" /></li>');
        }
        reader.readAsDataURL(newImgs[0]);

        // Post image to server
        console.log(newImgs);
        var formData = new FormData();
        formData.append('uploads', $('#fileSelect')[0].files[0]);
        $.ajax({
          method: 'POST',
          url: '/uploads',
          data: formData,
          contentType: false,
          processData: false,
          enctype: 'multipart/form-data',
        })
        .fail( function() {
          $('.upload-error').text('There was an error uploading your image, please try again later.');

          // Delete the new uploaded img form the image list
          $('.temporary').remove();
          console.log('Error!');
        })
        .done( function(data) {
          $('.upload-error').text('');

          // empty img list and repopulate with new fetched images
          $('#imageList').empty();
          app.materials.getImages();

          console.log('img saved');
        });
      }
    },

    init : () => {
      // trigger submit event and call func to upload to server
      $('#submit').on('click', function(evt){
        var fileEl = document.getElementById('fileSelect');
        var files = fileEl.files;
        evt.preventDefault();

        app.upload.uploadNewImg(this, files);
      });
    }
  }

  app.dragAndDrop = {

    drag : (evt) => {
      var style = window.getComputedStyle(event.target, null);
      evt.dataTransfer.setData('text/plain',
        (parseInt(style.getPropertyValue("left"), 10) - event.clientX) + ','
        + (parseInt(style.getPropertyValue("top"), 10) - event.clientY)+ ','
        + evt.target.id
      );

    },

    allowDrag : (evt) => {
      evt.preventDefault();
    },

    drop : (evt) => {
      evt.preventDefault();
      var data = evt.dataTransfer.getData('text/plain').split(',');
      var draggedEl = document.getElementById(data[2]);

      evt.target.appendChild(document.getElementById(data[2]));
      draggedEl.style.left = (event.clientX + parseInt(data[0],10)) + 'px';
      draggedEl.style.top = (event.clientY + parseInt(data[1], 10)) + 'px';
    },

    init : () => {
      var canvas = document.getElementById('droppableBox');
      var imgList = document.getElementById('imageList');

      var dragEl = document.querySelectorAll('.dragImg');
      // set which element can be dragged
      for( var i = 0; i < dragEl.length; i++){
        dragEl[i].addEventListener('dragstart', function(evt){
          app.dragAndDrop.drag(evt);
        });
      }

      // Allow canvas and imgList to accept droping elements
      canvas.addEventListener('dragover', function(evt){
        app.dragAndDrop.allowDrag(evt);
      });
      imgList.addEventListener('dragover', function(evt){
        app.dragAndDrop.allowDrag(evt);
      });

      // Allow canvas and imgList to accept droping elements
      canvas.addEventListener('drop', function(evt){
        app.dragAndDrop.drop(evt);
      });
      imgList.addEventListener('drop', function(evt){
        app.dragAndDrop.drop(evt);
      });
    }

  }

  app.scroll = function()
  {
    //Functions for page scroll
  }
  app.resize = function()
  {
    //Functions for window resize
  }
  app.load = function(cb)
  {
    //Functions for page load
    app.materials.getImages(cb);
  }
  app.init = function()
  {
    //Functions for page ready
    app.upload.init();
    app.dragAndDrop.init();
  }

    return app;
})(app, $ || jQuery);
window.onscroll = function()
{
  app.scroll();
}
window.onresize = function()
{
  app.resize();
}
window.onload = function()
{
  app.load(function(){
    app.init();
  });
};

