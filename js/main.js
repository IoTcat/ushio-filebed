// 登录
var check = true;

function msg(id,text,shake=true){
	$(id).addClass('text-danger').text(text);
	if (!shake) return;
	$("#login_form").removeClass('shake_effect');  
	setTimeout(function(){
		$("#login_form").addClass('shake_effect')
	},1); 
}
$(function(){
	// 显示表单
	$('#form-btn').hwLayer({
		width: 480,
		tapLayer: false
	});
	// 上传
	$("#upload").click(function(){
		$("#display").show(); //上传
		return false;
	})
	$("#hide").click(function(){
		$("#display").hide(1000);
		$('#text').hide();
        $('#text').val('');
        size = 0;
		return false;
	})

	// 表单切换
	$('.message a').click(function () {
	    $('form').animate({
	        height: 'toggle',
	        opacity: 'toggle'
	    }, 'slow');
	});
})


function select(){
	$('#text').select();
}

(function(){
    var options = {};
    $('.js-uploader__box').uploader({
    	'selectButtonCopy':'请选择或拖拽文件',
    	'instructionsCopy':'你可以选择或拖拽多个文件',
    	'submitButtonCopy':'上传选择的文件',
    	'furtherInstructionsCopy':'你可以选择或拖拽更多的文件',
    	'secondarySelectButtonCopy':'选择更多的文件'
    });
}());