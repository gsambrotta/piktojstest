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
          $('#imageList').append('<li><img src="'+ imgLink +'" id="dragImg'+ i +'" class="img-rounded dragEl" draggable="true" /></li>');

          // Add dragstart event to dinamycally created images
          // NOTE: If i would have time, i would probably do this is a better way.
          // I would probably abstact the 'dragstart' eventListener function and then call in app.text.createText
          // and app.dragAndDrop.init with .bind()
          var dragEl = document.querySelectorAll('.dragEl');
          for( var i = 0; i < dragEl.length; i++){
            dragEl[i].addEventListener('dragstart', function(evt){
              app.dragAndDrop.drag(evt);
            });
          }
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

    uploadNewImg : (btn, newImgs, formData) => {
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
        // Pre-display the image in the list to have early feedback for users.
        var reader = new FileReader();
        reader.onload = (e) => {
          $('#imageList').append('<li><img src=" '+ e.target.result +' " class="img-rounded temporary" /></li>');
        }
        reader.readAsDataURL(newImgs[0]);

        // Post image to server
        $.ajax({
          method: 'POST',
          url: '/uploads',
          data: formData,
          contentType: false,
          processData: false,
        })
        .fail( function() {
          $('.upload-error').text('There was an error uploading your image, please try again later.');

          // Delete the new uploaded img form the image list
          $('.temporary').remove();
        })
        .done( function(data) {
          $('.upload-error').text('');

          // empty img list and repopulate with new fetched images
          $('#imageList').empty();
          app.materials.getImages();
        });
      }
    },

    init : () => {
      // trigger submit event and call func to upload to server
      $('form').on('submit', function(evt){
        var formData = new FormData($(this)[0]);
        var fileEl = document.getElementById('fileSelect');
        var files = fileEl.files;
        evt.preventDefault();

        app.upload.uploadNewImg(this, files, formData);
      })
    }
  }

  app.dragAndDrop = {

    drag : (evt) => {
      var style = window.getComputedStyle(event.target, null);
      // Register 3 data on dataTransfer: left, top, id
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
      evt.target.appendChild(draggedEl);
      draggedEl.style.left = '0px';
      draggedEl.style.top = '0px';

    },

    dropAndMove : (evt) => {
      evt.preventDefault();
      var data = evt.dataTransfer.getData('text/plain').split(',');
      var draggedEl = document.getElementById(data[2]);
      // move the el, modifying its left and top position.
      // Set max left and top.
      evt.target.appendChild(draggedEl);
      var left = event.clientX + parseInt(data[0],10) > 500 ? 500 : event.clientX + parseInt(data[0],10);
      var top = event.clientY + parseInt(data[0],10) < 0 ? 0 : event.clientY + parseInt(data[0],10);

      draggedEl.style.left = left + 'px';
      draggedEl.style.top = top + 'px';
    },

    init : () => {
      var canvas = document.getElementById('droppableBox');
      var imgList = document.getElementById('imageList');
      var textList = document.getElementById('textList');
      var dragEl = document.querySelectorAll('.dragEl');

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
      textList.addEventListener('dragover', function(evt){
        app.dragAndDrop.allowDrag(evt);
      });

      // Allow canvas and imgList to accept droping elements
      canvas.addEventListener('drop', function(evt){
        app.dragAndDrop.dropAndMove(evt);
      });
      imgList.addEventListener('drop', function(evt){
        app.dragAndDrop.drop(evt);
      });
      textList.addEventListener('drop', function(evt){
        app.dragAndDrop.drop(evt);
      });
    }

  },

  app.text = {
    createText : () => {
      // give ID to input based on index. First index would be -1, so i give +1 to all the index
      var index = $('#textList li').index() < 0 ? 0 : $('#textList li').index() + 1;
      $('#textList').append('<li><input type="text" class="dragEl" id="dragText'+index+'" draggable="true" /></li>');

      // Add dragstart event to dinamycally created input
      // NOTE: If i would have time, i would probably do this is a better way.
      // I would probably abstact the 'dragstart' eventListener function and then call in app.text.createText
      // and app.dragAndDrop.init with .bind()
      var dragEl = document.querySelectorAll('.dragEl');
      for( var i = 0; i < dragEl.length; i++){
        dragEl[i].addEventListener('dragstart', function(evt){
          app.dragAndDrop.drag(evt);
        });
      }
    },

    init : () => {
      // Add text to text list when btn us clicked.
      $('#addText').on('click', () => {
        app.text.createText();
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
    app.text.init();
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

