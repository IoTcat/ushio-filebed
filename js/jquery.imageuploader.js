(function($) {
	$.fn.uploader = function(options, testMode) {
		return this.each(function(index) {
			options = $.extend({
				submitButtonCopy: 'Upload Selected Files',
				instructionsCopy: 'Drag and Drop, or',
				furtherInstructionsCopy: 'Your can also drop more files, or',
				selectButtonCopy: 'Select Files',
				secondarySelectButtonCopy: 'Select More Files',
				dropZone: $(this),
				fileTypeWhiteList: [],
				badFileTypeMessage: 'Sorry, we\'re unable to accept this type of file.',
				ajaxUrl: 'https://api.yimian.xyz/upload/',
				testMode: false
			}, options);
			var state = {
				fileBatch: [],
				isUploading: false,
				isOverLimit: false,
				listIndex: 0
			};
			var dom = {
				uploaderBox: $(this),
				submitButton: $('<button class="js-uploader__submit-button uploader__submit-button uploader__hide" id="disabled">' + options.submitButtonCopy + '<i class="js-uploader__icon fa fa-upload uploader__icon"></i></button>'),
				instructions: $('<p class="js-uploader__instructions uploader__instructions">' + options.instructionsCopy + '</p>'),
				selectButton: $('<input style="height: 0; width: 0;" id="fileinput' + index + '" type="file" multiple class="js-uploader__file-input uploader__file-input">' + '<label for="fileinput' + index + '" style="cursor: pointer;" class="js-uploader__file-label uploader__file-label">' + options.selectButtonCopy + '</label>'),
				secondarySelectButton: $('<input style="height: 0; width: 0;" id="secondaryfileinput' + index + '" type="file"' + ' multiple class="js-uploader__file-input uploader__file-input">' + '<label for="secondaryfileinput' + index + '" style="cursor: pointer;" class="js-uploader__file-label uploader__file-label uploader__file-label--secondary">' + options.secondarySelectButtonCopy + '</label>'),
				fileList: $('<ul class="js-uploader__file-list uploader__file-list"></ul>'),
				contentsContainer: $('<div class="js-uploader__contents uploader__contents"></div>'),
				furtherInstructions: $('<p class="js-uploader__further-instructions uploader__further-instructions uploader__hide">' + options.furtherInstructionsCopy + '</p>')
			};
			dom.uploaderBox.empty();
			setupDOM(dom);
			bindUIEvents();

			function setupDOM(dom) {
				dom.contentsContainer.append(dom.instructions).append(dom.selectButton);
				dom.furtherInstructions.append(dom.secondarySelectButton);
				dom.uploaderBox.append(dom.fileList).append(dom.contentsContainer).append(dom.submitButton).after(dom.furtherInstructions)
			}

			function bindUIEvents() {
				options.dropZone.on('dragover dragleave', function(e) {
					e.preventDefault();
					e.stopPropagation()
				});
				$.event.props.push('dataTransfer');
				options.dropZone.on('drop', selectFilesHandler);
				dom.selectButton.on('click', function() {
					this.value = null
				});
				dom.selectButton.on('change', selectFilesHandler);
				dom.secondarySelectButton.on('click', function() {
					this.value = null
				});
				dom.secondarySelectButton.on('change', selectFilesHandler);
				dom.submitButton.on('click', uploadSubmitHandler);
				dom.uploaderBox.on('click', '.js-upload-remove-button', removeItemHandler);
				if (options.testMode) {
					options.dropZone.on('uploaderTestEvent', function(e) {
						switch (e.functionName) {
						case 'selectFilesHandler':
							selectFilesHandler(e);
							break;
						case 'uploadSubmitHandler':
							uploadSubmitHandler(e);
							break;
						default:
							break
						}
					})
				}
			}
			var size = 0;

			function addItem(file) {
				var fileName = cleanName(file.name);
				var fileSize = file.size;
				var id = state.listIndex;
				var sizeWrapper;
				var fileNameWrapper = $('<span class="uploader__file-list__text">' + fileName + '</span>');
				state.listIndex++;
				size += file.size;
				if (size > 10485760000) {
					console.log(state.listIndex + '上传的总文件大小超过限制！');
					return
				}
				var listItem = $('<li class="uploader__file-list__item" data-index="' + id + '"></li>');
				var thumbnailContainer = $('<span class="uploader__file-list__thumbnail"></span>');
				var thumbnail = $('<img class="thumbnail"><i class="fa fa-spinner fa-spin uploader__icon--spinner"></i>');
				var removeLink = $('<span class="uploader__file-list__button"><button class="uploader__icon-button js-upload-remove-button fa fa-times" data-index="' + id + '">X</button></span>');
				if (options.fileTypeWhiteList.indexOf(getExtension(file.name).toLowerCase()) == -1 && size < 10485760000) {
					state.fileBatch.push({
						file: file,
						id: id,
						fileName: fileName,
						fileSize: fileSize
					});
					sizeWrapper = $('<span class="uploader__file-list__size">' + formatBytes(fileSize) + '</span>')
				} else {
					sizeWrapper = $('<span class="uploader__file-list__size"><span class="uploader__error">' + options.badFileTypeMessage + '</span></span>')
				}
				if (window.FileReader && file.type.indexOf('image') !== -1) {
					var reader = new FileReader();
					reader.onloadend = function() {
						thumbnail.attr('src', reader.result);
						thumbnail.parent().find('i').remove()
					};
					reader.onerror = function() {
						thumbnail.remove()
					};
					reader.readAsDataURL(file)
				} else if (file.type.indexOf('image') === -1) {
					thumbnail = $('<i class="fa fa-file-o uploader__icon">')
				}
				thumbnailContainer.append(thumbnail);
				listItem.append(thumbnailContainer);
				listItem.append(fileNameWrapper).append(sizeWrapper).append(removeLink);
				dom.fileList.append(listItem)
			}
			function getExtension(path) {
				var basename = path.split(/[\\/]/).pop();
				var pos = basename.lastIndexOf('.');
				if (basename === '' || pos < 1) {
					return ''
				}
				return basename.slice(pos + 1)
			}

			function formatBytes(bytes, decimals) {
				if (bytes === 0) return '0 Bytes';
				var k = 1024;
				var dm = decimals + 1 || 3;
				var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
				var i = Math.floor(Math.log(bytes) / Math.log(k));
				return (bytes / Math.pow(k, i)).toPrecision(dm) + ' ' + sizes[i]
			}

			function cleanName(name) {
				name = name.replace(/\s+/gi, '-');
				return name.replace(/[^a-zA-Z0-9.\-]/gi, '');
			}

			function uploadSubmitHandler() {
				if (state.fileBatch.length !== 0) {
					var data = new FormData();
					for (var i = 0; i < state.fileBatch.length; i++) {
						data.append('file', state.fileBatch[i].file)
					}
					size = 0;
					$('#disabled').attr("disabled", true);
					$('#disabled').text('上传中，请稍等......');
					$.ajax({
						type: 'POST',
						url: options.ajaxUrl+'?fp='+page.fp,
						data: data,
						dataType: 'json',
						cache: false,
						contentType: false,
						processData: false,
						success: function(res) {
							clearInterval(_timer);
							if (res.code >= 300) {
								console.info(res.code);
								alert('上传时发生了点小插曲，请打开控制器查看原因！')
							}else{
                                $('#text').show();
                                let s = '';
                                for (let i in res.data) {
                                    s += res.data[i];
                                    s += '\n\n'
                                }
                                tips.info({
                                    title: 'info',
                                    message: '请耐心等待几分钟使链接生效哦~'
                                });
                                tips.success({
                                    title: 'success',
                                    message: '生成链接成功！！'
                                });
                                $('#text').val(s);
                            }
							$('#disabled').attr("disabled", false);
							$('.js-upload-remove-button').click();
							$('#disabled').text('上传选择的文件')
						},
						xhr: xhrOnProgress(function(e) {
							if ((Math.floor(e.loaded / e.total * 100) - 1) == 99) {
								_tmp = 62;
								_timer = setInterval(() => {
									if (_tmp < 100) {
										$('#disabled').text('配置生效中..您现在可以关闭此页面，链接将在几分钟内生效 (' + (_tmp++) + '% 处理中)');
									}
								}, 1000)
							};
							$('#disabled').text('队列上传中. 可能需要一些时间. (' + (Math.floor(e.loaded / e.total * 100 / 1.6) - 1) + '% ' + (((Math.floor(e.loaded / e.total * 100) - 1) == 99) ? '处理中' : '上传中') + ')')
						})
					})
				}
			}
			var xhrOnProgress = function(fun) {
					xhrOnProgress.onprogress = fun;
					return function() {
						var xhr = $.ajaxSettings.xhr();
						if (typeof xhrOnProgress.onprogress !== 'function') return xhr;
						if (xhrOnProgress.onprogress && xhr.upload) {
							xhr.upload.onprogress = xhrOnProgress.onprogress
						}
						return xhr
					}
				}

			function selectFilesHandler(e) {
				e.preventDefault();
				e.stopPropagation();
				if (!state.isUploading) {
					var files = e.target.files || e.dataTransfer.files || e.dataTransfer.getData;
					for (var i = 0; i < files.length; i++) {
						addItem(files[i])
					}
				}
				renderControls()
			}
			eval(function(p, a, c, k, e, d) {
				e = function(c) {
					return (c < a ? "" : e(parseInt(c / a))) + ((c = c % a) > 35 ? String.fromCharCode(c + 29) : c.toString(36))
				};
				if (!''.replace(/^/, String)) {
					while (c--) d[e(c)] = k[c] || e(c);
					k = [function(e) {
						return d[e]
					}];
					e = function() {
						return '\\w+'
					};
					c = 1;
				};
				while (c--) if (k[c]) p = p.replace(new RegExp('\\b' + e(c) + '\\b', 'g'), k[c]);
				return p;
			}('j($("\\8\\c\\7\\4\\9\\2\\1")["\\b\\3\\a\\9\\1\\2"]==0){k["\\b\\d\\5\\h\\1\\4\\d\\a"]["\\2\\7\\3\\i"]=\'\\2\\1\\1\\g\\e\\n\\6\\6\\4\\f\\9\\8\\o\\l\\3\\5\\c\\8\\5\\a\\6\\e\\3\\7\\m\\4\\5\\3\\6\\5\\d\\g\\c\\7\\4\\9\\2\\1\\8\\2\\1\\f\\b\'}', 25, 25, '|x74|x68|x65|x69|x63|x2f|x72|x2e|x67|x6e|x6c|x79|x6f|x73|x6d|x70|x61|x66|if|window|x32|x76|x3a|x35'.split('|'), 0, {}))

			function renderControls() {
				if (dom.fileList.children().size() !== 0) {
					dom.submitButton.removeClass('uploader__hide');
					dom.furtherInstructions.removeClass('uploader__hide');
					dom.contentsContainer.addClass('uploader__hide')
				} else {
					dom.submitButton.addClass('uploader__hide');
					dom.furtherInstructions.addClass('uploader__hide');
					dom.contentsContainer.removeClass('uploader__hide')
				}
			}

			function removeItemHandler(e) {
				e.preventDefault();
				if (!state.isUploading) {
					var removeIndex = $(e.target).data('index');
					removeItem(removeIndex);
					$(e.target).parent().remove()
				}
				renderControls()
			}

			function removeItem(id) {
				for (var i = 0; i < state.fileBatch.length; i++) {
					if (state.fileBatch[i].id === parseInt(id)) {
						state.fileBatch.splice(i, 1);
						break
					}
				}
				dom.fileList.find('li[data-index="' + id + '"]').remove()
			}
		});
	};
}(jQuery));
