(function(){
  var photoContainer    = $('#photoContainer'),
      inputs            = $('.form.user input,textarea'),
      file_input        = $('.form input[type="file"]'),
      message           = $(".ui.transition.message.main"),
      list              = $(".ui.transition.message.main .list"),
      header            = $(".ui.transition.message.main .header"),
      uploadMsgBox      = $("#uploadMsgBox"),
      uploadMsgHeader   = $("#uploadMsgBox .header"),
      uploadMsgLst      = $("#uploadMsgBox .list"),
      uploadInput       = $('#fileInput'),
      preview           = $('#preview');

  var unDisplayPreview = () => {
    preview[0].src = '';
    preview.transition({
      animation   : 'scale',
      onComplete  : function(){ preview[0].style = "display: none;"; }
    });
  }

  var displayMsg = (headerText, type, lines, messageBox = [message, header, list]) => {
    messageBox[0].removeClass("negative positive success").addClass(type);
    messageBox[1].text(headerText);
    messageBox[2].empty();
    lines.forEach((line) => {
      if (typeof line === 'object'){
        if (typeof line[1] === 'object'){
          line[1].classList.add((type === 'negative') ? 'error' : 'success');
        } else if (typeof line[1] === 'string'){
          $("[name='" + line[1] + "']").closest(".field")[0].classList.add((type === 'negative') ? 'error' : 'success');
        }
        messageBox[2].append("<li>" + line[0] + "</li>");
      } else {
        messageBox[2].append("<li>" + line + "</li>");
      }
    });
  }

  var arrayBufferToBase64 = (typedArray) => {
    var dataView = new Uint8Array(typedArray);

    return `data:image/jpeg;base64,` + btoa(String.fromCharCode.apply(null, dataView));
  }

  var checkImgIntegrity = (typedArray) => {
    if (typeof typedArray !== 'object')
      return false;

    var dataView = new Uint8Array(typedArray);

    if (typeof dataView !== 'object'
        || (dataView[0] !== 255 || dataView[1] !== 216))
      return false;
    return true;
  }

  var uploadPicture = (upload = false) => {
    var reader = new FileReader();

    $('#uploadButton').addClass('loading');

    if (!uploadInput[0] || !uploadInput[0].files || uploadInput[0].files.length === 0){
      if (preview[0].src !== '' || preview.css('display') !== 'none'){
        unDisplayPreview()
      }
      $('#uploadButton').removeClass('loading');
      return ;
    }

    reader.onloadend = () => {
      if (uploadMsgBox.hasClass('visible') || uploadMsgBox.hasClass('in'))
        uploadMsgBox.transition('clear queue').transition({animation: 'fade', duration: 0});
      if (!checkImgIntegrity(reader.result)){
        if (preview[0].src !== '' || preview.css('display') !== 'none'){
          unDisplayPreview()
        }
        uploadMsgBox.transition({animation: 'fade', duration: 1500});
        displayMsg("Picture error", "error", ["Wrong image selected"], [uploadMsgBox, uploadMsgHeader, uploadMsgLst]);
        $('#uploadButton').removeClass('loading');
        return false;
      }

      preview[0].src = arrayBufferToBase64(reader.result);
      if (upload === true){
        request('/uploadPicture', 'POST', $({name: 'picture', value: preview[0].src}), (res) => {
          $('#uploadButton').removeClass('loading');
          uploadMsgBox.transition({animation: 'fade', duration: 1500});
          displayMsg("Information", 'positive', res.success, [uploadMsgBox, uploadMsgHeader, uploadMsgLst]);
        }, (res) => {
          $('#uploadButton').removeClass('loading');
          uploadMsgBox.transition({animation: 'fade', duration: 1500});
          displayMsg("Error from server", 'negative', res.error, [uploadMsgBox, uploadMsgHeader, uploadMsgLst]);
        });
      } else {
        $('#uploadButton').removeClass('loading');
      }
      if (preview.css('display') !== 'none') return false;
      preview.transition({
        animation   : 'scale',
      });
    };
    reader.readAsArrayBuffer(uploadInput[0].files[0]);
    return false;
  }

  $(document).ready(function(){
    $('.dropdown').dropdown({ action: 'activate' });
    $('.ui.multiple.dropdown').dropdown({ allowAdditions: true });
    $('.message .close')
      .on('click', function() {
        $(this)
          .closest('.message')
          .transition('fade');
      });

    uploadInput.on('change', uploadPicture);

    $('#submitPhoto').on('click', (ev) => {
      ev.preventDefault();
      $('.ui.modal')
        .modal('setting', 'closable', false)
        .modal('setting', 'transition', 'fade up')
        .modal('setting', 'onApprove', uploadPicture.bind(uploadPicture, true))
        .modal('show');
    });

    photoContainer.dimmer({ on: 'hover' });

    $('#submit').on('click', (ev) => {
      ev.preventDefault();
      var errorInputs = $(".error"),
          errors = checkform(inputs, [
            [inputs[0].name === "first-name", inputs[0].value.length > 0, /^([a-zA-Z|\ ])+$/.test(inputs[0].value)],
            [inputs[1].name === "last-name", inputs[1].value.length > 0, /^([a-zA-Z]|\ )+$/.test(inputs[1].value)],
            [inputs[2].name === "email", inputs[2].value.length > 0, /^[\w\-\.]+@([\w]+\.){1,2}[a-zA-Z]{2,3}$/.test(inputs[2].value)],
            [inputs[3].name === "date", inputs[3].value.length > 0, /^[0-9]{4}\-(0[1-9]|1[0-2])\-([0-2][0-9]|3[0-1])$/.test(inputs[3].value)],
            [inputs[4].name === "gender", (parseInt(inputs[4].value) === 1 || parseInt(inputs[4].value) === 2)],
            [inputs[5].name === "sexualOrientation", (parseInt(inputs[5].value) === 1 || parseInt(inputs[5].value) === 0 || parseInt(inputs[5].value) === 2)],
            [inputs[6].name === "bio", true],
            [inputs[7].name === "tags", (inputs[7].value === "" || inputs[7].value.split(',').filter((elem) => !(Number.isInteger(parseInt(elem)))).length === 0)],
          ], [
            ["Wrong first-name input name sent", "First name input needs to be filled", "Only letters are accepted in first name input"],
            ["Wrong last-name input name sent", "Last name input needs to be filled", "Only letters are accepted in last name input"],
            ["Wrong email input name sent", "Email input needs to be filled", "Email format isn't correct"],
            ["Wrong date input name sent", "Date input needs to be filled", "Wrong date format"],
            ["Wrong gender input name sent", "Wrong gender selected"],
            ["Wrong sexual orientation input name sent", "Wrong sexual orientation selected"],
            ["Wrong biography input name sent"],
            ["Wrong tags input name sent", "Wrong tags selected"],
          ]);

      if (message.hasClass('visible') || message.hasClass('in'))
        message.transition('clear queue').transition({animation: 'fade', duration: 0});

      if (errorInputs.length > 0){
        errorInputs.removeClass('error');
      }

      if (errors.length > 0){
        $('html, body').animate({scrollTop: message.offset().top}, 'slow');
        message.transition({animation: 'fade', duration: 1500});
        displayMsg("Inputs errors", 'negative', errors);
      } else {
        request('/updateInfo', 'POST', inputs, (res) => {
          $('html, body').animate({scrollTop: message.offset().top}, 'slow');
          message.transition({animation: 'fade', duration: 1500});
          displayMsg("Information", 'positive', res.success);
        }, (res) => {
          $('html, body').animate({scrollTop: message.offset().top}, 'slow');
          message.transition({animation: 'fade', duration: 1500});
          displayMsg("Error from server", 'negative', res.error);
        });
      }
    });
  });
})();