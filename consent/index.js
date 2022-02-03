;(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(['bootstrap', 'crypto'], factory);
	} else if (typeof exports === 'object') {
		module.exports = factory(require('bootstrap'), require('crypto'));
	} else {
		root.swConsent = factory(root.bootstrap, root.crypto);
	}
}(this, function (bootstrap, crypto) {

	var swConsent = (function () {
		var swConsent = function (sel, context) {
			return new swConsent.fn.newConsent(sel, context);
		};

		swConsent.fn = swConsent.prototype = {
			constructor: swConsent,
			newConsent: function (sel, context) {
				var elem;

				if (!sel) return this;

				if (sel != document) {
					elem = swConsent.extend({ found: swConsent.dom(sel, context) }, swConsent);
				} else {
					elem = swConsent.extend({ found: { 0: document } }, swConsent);
				}

				return elem;
			}
		};

		swConsent.extend = swConsent.fn.extend = function () {
			var base = {};

			if (arguments[1] == undefined && typeof arguments[1] != "boolean") {
				base = this;
			}

			for (var i = 0; i < arguments.length; i++) {
				if (arguments[i] != null) {
					for (value in arguments[i]) {
						base[value] = arguments[i][value];
					}
				}
			}

			return base;
		};

		swConsent.extend({
			setAjaxData: function(data) {
				swConsent.ajaxData = swConsent.extend(swConsent.ajaxData, data);
			},
			ajax: function(data) {
				let xhr = new XMLHttpRequest(),
					formData = new FormData();

				for(var key in data.data) {
					if(typeof data[key] !== 'object') {
						continue;
					}
					data[key] = swConsent.extend(swConsent.ajaxData[key], data[key]);
				}
				for(var key in swConsent.ajaxData) {
					if(typeof swConsent.ajaxData[key] !== 'object') {
						continue;
					}
					data[key] = swConsent.extend(swConsent.ajaxData[key], data[key]);
				}
				data = swConsent.extend(swConsent.ajaxData, data);
				
				for(var key in data.data) {
					if(typeof data.data[key] === 'object') {
						formData.append(key, JSON.stringify(data.data[key]));
					} else {
						formData.append(key, data.data[key]);
					}
				}

				if(swConsent.showDebug) {
					console.log('Send data before: ', data);
				}

				xhr.open(data.method ? data.method.toUpperCase() : 'POST', data.url ? data.url : '/', true);
				// xhr.setRequestHeader("Content-Type", (data.dataType ? data.dataType : 'application/json'));
				
				if(data.success === undefined) {
					data.success = function() {};
				}

				xhr.onreadystatechange = function () {
					data.success(this);
				};

				xhr.send(formData);

				if(swConsent.showDebug) {
					console.log('Send data after: ', data, xhr);
				}

				return xhr;
			}
		});

		swConsent.extend({
			urlContains: function(needle) {
				return (location.href.indexOf(needle) !== -1);
			},
			urlQuery: function(index) {
				var href = arguments[1]||location.href,
					queryString = href.substring(href.indexOf("?") + 1),
					queries = swConsent.urlQueries(queryString);

				return queries[index];
			},
			urlQueries: function(str) {
				var queries = str.split('&'),
					parameters = {};

				queries.forEach(function(parameter) {
					parameter = parameter.split('=');
					parameters[parameter[0]] = parameter[1];
				})

				return parameters;
			}
		});

		swConsent.extend({
			translate: function(translations, path) {
				var language = 'default',
					trans = translations[language];

				for(var key in path) {
					trans = trans[path[key]]
				}

				return trans;
			}
		});

		swConsent.extend({
			getTemplate: function() {
				return swConsent.template
			},
			getAcceptFormTemplate: function() {
				return swConsent.acceptFormTemplate
			},
			addHtmlForTechnicalCookies: function () {
				if(!swConsent.askForTechnicalCookies) {
					return '';
				}
				return `<div class="row"><div class="col-sm-12">
	<label for="sw-consent-tool-type-basic" class="form-check form-switch">Essentielle Cookies
		<input class="form-check-input" id="sw-consent-tool-type-basic" name="sw_consent_tool[basic]" type="checkbox" data-toggle="toggle" data-style="ios" value="1" checked readonly>
	</label>
</div></div>`;
			},
			addHtmlForTypes: function() {
				let types = [];

				if(!swConsent.askForExternal) {
					return '';
				}

				swConsent.consentTypes.forEach(function(type) {
					types.push(`<div class="row"><div class="col-sm-12">
	<label for="sw-consent-tool-type-${type.type}" class="form-check form-switch">${type.label}
		<input class="form-check-input" id="sw-consent-tool-type-${type.type}" name="sw_consent_tool[${type.type}]" data-toggle="toggle" data-style="ios" type="checkbox" value="1"${(swConsent.checkPermission(type.type) ? ' checked' : '')}>
	</label>
</div></div>`);
				});

				return types.join('');
			},
			addHtmlForDetails: function() {
				let details = [];

				swConsent.consentTypes.forEach(function(type) {
					details.push(`<div class="row" data-sw-consent-details-type="${type.type}">`);
					details.push(`<h3 class="col-sm-12">${type.label}</h3>`);
					for(let tool in swConsent.tools) {
						let description = '';
						let cookieDetails = swConsent.cookieDetails;
						if(swConsent.tools[tool].type === type.type) {
							if(swConsent.showDetailsDescription) {
								description = swConsent.translate(swConsent.tools[tool].translation, ['description']);
								if(description !== '' && description !== undefined) {
									description = '<p>' + swConsent.translate(swConsent.tools[tool].translation, ['description']) + '</p>';
									if(swConsent.tools[tool].cookies !== undefined) {
										if(cookieDetails === '') {
											
											cookieDetails += '<div class="sw-consent-tool-show-cookie-details-description">';

												cookieDetails += '<input type="checkbox" id="sw-consent-tool-show-cookie-details-for-' + tool + '" value="1">';
												cookieDetails += '<label for="sw-consent-tool-show-cookie-details-for-' + tool + '">Details anzeigen</label>';

												swConsent.tools[tool].cookies.forEach(function(cookie) {
													cookieDetails += '<ul class="sw-consent-tool-show-cookie-details container">';
														cookieDetails += '<li class="row"><span class="col col-sm-4">Name:</span><span class="col col-sm">' + cookie.name + '</span></li>';
														cookieDetails += '<li class="row"><span class="col col-sm-4">Speicherdauer:</span><span class="col col-sm">' + swConsent.formatExpiration(cookie.expired) + '</span></li>';
														cookieDetails += '<li class="row sw-consent-tool-show-cookie-details-description"><span class="col col-sm-12">' + swConsent.translate(cookie.translation, ['description']) + '</span></li>';
													cookieDetails += '</ul>';
												});

											cookieDetails += '</div>';
										}
									}
								} else {
									description = '';
								}
							}

							if(!swConsent.showDetailsDescription) {
								details.push(`<div class="col-sm-6">
	<label class="form-check form-switch" for="sw-consent-tool-type-${type.type}-${tool}">${swConsent.translate(swConsent.tools[tool].translation, ['title'])}
		<input class="form-check-input" id="sw-consent-tool-type-${type.type}-${tool}" data-sw-consent-type="${type.type}" name="sw_consent_tool[${tool}]" type="checkbox" data-toggle="toggle" data-style="ios" value="1"${(swConsent.checkPermission(tool) ? ' checked' : '')}>
	</label>
</div>`);
							} else {
								details.push(`<div class="col-sm-12">
	<label class="form-check form-switch" for="sw-consent-tool-type-${type.type}-${tool}">
	<input class="form-check-input" id="sw-consent-tool-type-${type.type}-${tool}" data-sw-consent-type="${type.type}" name="sw_consent_tool[${tool}]" type="checkbox" data-toggle="toggle" data-style="ios" value="1"${(swConsent.checkPermission(tool) ? ' checked' : '')}>
		${swConsent.translate(swConsent.tools[tool].translation, ['title'])}
		${description}
	</label>
	${cookieDetails}
</div>`);
							}
						}
					}
					details.push(`</div>`);
				});

				return details.join('');
			},
			submit: function(e) {
				var formData = new FormData(this),
					oDataset = swConsent.getStorage('sw-consent-tool', true);

				e.preventDefault();

				if(!oDataset) {
					oDataset = {
						saved: true,
						permissions: {}
					};
				}

				if(oDataset.permissions === undefined) {
					oDataset.permissions = {}
				}

				formData.forEach(function(value, fieldName) {
					let rx = /\[([^\]]*)\]/g;
					oDataset.permissions[rx.exec(fieldName)[1]] = value;
				});

				oDataset.saved = crypto.createHash('md5').update(JSON.stringify(oDataset)).digest("hex");
				localStorage.setItem('sw-consent-settings', JSON.stringify(oDataset));
				$template.remove();

				swConsent.loadAllowedTools();
			},
			addHtmlFooterLinks: function() {
				let links = [];

				this.footerLinks.forEach(function(link) {
					links.push('<a href="' + link.link + '" class="col col-lg-3 btn">' + link.title + '</a>')
				});

				return '<div class="modal-footer"><div class="container"><div class="row justify-content-sm-center">' + links.join("\n") + '</div></div></div>';
			},
			showContsentBar: function (forceOpen = false) {
				let template = ''
					$template = null,
					modal = {},
					settingsDone = swConsent.getStorage('sw-consent-tool', true);

				if(swConsent.showDebug) {
					console.log('showContsentBar: local storage', settingsDone);
				}

				if(!forceOpen && !(
					swConsent.urlContains('sw_consent_bar=1') ||
					swConsent.urlContains('local_gtm_bar=1')
				)) {
					if(settingsDone.saved && swConsent.showOnlyOnce) {
						return;
					} else if(settingsDone.saved && !swConsent.showOnlyOnce && swConsent.showDebug) {
						console.info('%cReopen consent bar, because option "showOnlyOnce" is inactive', 'color: #aa0;');
					}
				}

				template = swConsent.getTemplate();
				if(typeof template === 'string') {
					document.body.insertAdjacentHTML(swConsent.bodyPosition, template);
				}

				$template = document.getElementById('sw-consent-tool');

				$template.innerHTML = $template.innerHTML.replace('##technical_cookies##', swConsent.addHtmlForTechnicalCookies());
				$template.innerHTML = $template.innerHTML.replace('##required_cookies##', swConsent.addHtmlForTypes());
				$template.innerHTML = $template.innerHTML.replace('##details_cookie##', swConsent.addHtmlForDetails());
				$template.innerHTML = $template.innerHTML.replace('##footer##', swConsent.addHtmlFooterLinks());

				if($template.getElementsByTagName('form').length) {
					$template
						.getElementsByTagName('form')[0]
						.addEventListener('submit', swConsent.submit);
				}

				let bsModal = new bootstrap.Modal(document.getElementById('sw-consent-tool-modal'), {
					keyboard: false,
					backdrop: 'static'
				});

				if(!swConsent.hidePopup) {
					if(swConsent.showDebug) {
						console.log('HidePopup is false.');
					}
					bsModal.show();
				} else if(swConsent.showDebug) {
					console.log('HidePopup is true.');
				}

				$template.querySelectorAll('.sw-consent-tool-save')
					.forEach(function(item) {
						item.addEventListener('click', function(e) {
							let checkboxes = $template.querySelectorAll('[id^="sw-consent-tool-type-"]'),
								oDataset = swConsent.getStorage('sw-consent-tool', true);

							if(!oDataset) {
								oDataset = {
									saved: true,
									permissions: {}
								};
							}

							if(oDataset.permissions === undefined) {
								oDataset.permissions = {}
							}

							checkboxes.forEach(function(element) {
								let rx = /\[([^\]]*)\]/g,
									name = rx.exec(element.name)[1];
								if(element.checked) {
									oDataset.permissions[name] = element.value;
									element.checked = true;
									element.setAttribute('checked', true);
								} else {
									oDataset.permissions[name] = null;
									delete oDataset.permissions[name];
									element.checked = false;
									element.removeAttribute('checked');
								}
							});

							oDataset.saved = crypto.createHash('md5').update(JSON.stringify(oDataset)).digest("hex");
							localStorage.setItem('sw-consent-settings', JSON.stringify(oDataset));
							bsModal.hide();

							swConsent.ajax({
								data: {
									action: 'save',
									hash: oDataset.saved,
									permissions: oDataset.permissions
								}
							})

							swConsent.loadAllowedTools();
						});
					});

				$template.querySelectorAll('.sw-consent-tool-consent-all')
					.forEach(function(item) {
						item.addEventListener('click', function(e) {
							let checkboxes = $template.querySelectorAll('[id^="sw-consent-tool-type-"]'),
								oDataset = swConsent.getStorage('sw-consent-tool', true);

							if(!oDataset) {
								oDataset = {
									saved: true,
									permissions: {}
								};
							}

							if(oDataset.permissions === undefined) {
								oDataset.permissions = {}
							}

							checkboxes.forEach(function(elements) {
								elements.checked = true;
								let rx = /\[([^\]]*)\]/g;
								oDataset.permissions[rx.exec(elements.name)[1]] = elements.value;
							});

							oDataset.saved = crypto.createHash('md5').update(JSON.stringify(oDataset)).digest("hex");
							localStorage.setItem('sw-consent-settings', JSON.stringify(oDataset));
							bsModal.hide();

							swConsent.ajax({
								data: {
									action: 'saveAll',
									hash: oDataset.saved,
									permissions: oDataset.permissions
								}
							})

							swConsent.loadAllowedTools();
						});
					});

				swConsent.consentTypes.forEach(function(type) {
					if(document.getElementById('sw-consent-tool-type-' + type.type) !== null) {
						document.getElementById('sw-consent-tool-type-' + type.type)
							.addEventListener('change', function(e) {
								let checkboxes = $template.querySelectorAll('[id^="sw-consent-tool-type-' + type.type + '-"]');
								checkboxes.forEach(function(elements) {
									elements.checked = e.target.checked;
								});
							});
					}
				});

				if($template.querySelectorAll('[data-sw-consent-type]') !== null) {
					$template
						.querySelectorAll('[data-sw-consent-type]')
						.forEach(function(elements) {
							elements.addEventListener('change', function(e) {
								let generalType = document.getElementById('sw-consent-tool-type-' + this.dataset.swConsentType);

								if(swConsent.showDebug) {
									console.log('On change', this.dataset);
								}
								if(generalType !== null)  {
									generalType.checked = false;
								} else if(swConsent.showDebug) {
									console.log('%cNo general type defined for ID sw-consent-tool-type-' + this.dataset.swConsentType + '; Please add ##required_cookies## if needed.', 'color: #dd0', this.dataset);
								}
							});
						});
				}
			},
			addAcceptForm: function(tool, position, element = null, template = '') {
				let $acceptForms = null;
				swConsent.acceptFormTemplate;

				if(typeof template === 'string') {
					element.insertAdjacentHTML(position, template);
				}

				$acceptForms = document.querySelectorAll('.sw-consent-tool-accept-form');

				$acceptForms.forEach(function(form) {
					form.querySelectorAll('[data-sw-consent-tool-load]').forEach(function(button) {
						button.addEventListener('click', function(e) {
							let oDataset = swConsent.getStorage('sw-consent-tool', true),
								acceptData = JSON.parse(this.dataset.swConsentToolLoad);

							e.preventDefault();

							if(!oDataset) {
								oDataset = {
									saved: true,
									permissions: {}
								};
							}

							if(oDataset.permissions === undefined) {
								oDataset.permissions = {}
							}

							oDataset.permissions[acceptData.tool] = 1;

							oDataset.saved = crypto.createHash('md5').update(JSON.stringify(oDataset)).digest("hex");
							localStorage.setItem('sw-consent-settings', JSON.stringify(oDataset));

							swConsent.loadTool(acceptData.tool);
							$acceptForms.forEach(function(_form) {
								_form.remove();
							});
						})
					})
				});
			}
        });

		swConsent.extend({
			formatExpiration: function(expired) {
				if(expired > 31536000) {
					return Math.round(expired / 60 / 60 / 24 / 365) + ' Jahre';
				}

				if(expired > 86400) {
					return Math.round(expired / 60 / 60 / 24) + ' Tage';
				}

				if(expired > 3600) {
					return Math.round(expired / 60 / 60) + ' Stunden';
				}

				if(expired > 60) {
					return Math.round(expired / 60) + ' Minuten';
				}
			},
			add: function(tool, data) {
				if(swConsent.tools[tool] === undefined) {
					swConsent.tools[tool] = {};
				}

				if(
					swConsent.tools[tool].granted !== undefined &&
					data.granted !== undefined
				) {
					data.granted = Object.assign(data.granted, swConsent.tools[tool].granted);
				}

				if(
					swConsent.tools[tool].denied !== undefined &&
					data.denied !== undefined
				) {
					data.denied = Object.assign(data.denied, swConsent.tools[tool].denied);
				}

				swConsent.tools[tool] = Object.assign(swConsent.tools[tool], data);

				return swConsent.tools[tool];
			},
			loadTool: function(tool) {
				if(swConsent.loadAllTools || swConsent.checkPermission(tool)) {
					if(swConsent.showDebug) {
						console.log('load', tool, 'tool', 'LoadAllOption:', swConsent.loadAllTools, 'Permission:', swConsent.checkPermission(tool));
					}

					if(
						swConsent.tools[tool].callback !== undefined || 
						swConsent.tools[tool].granted !== undefined
					) {
						if(swConsent.tools[tool].callback !== undefined) {
							let args = [];

							if(swConsent.tools[tool].callbackArguments) {
								args = swConsent.tools[tool].callbackArguments;
							}

							if (swConsent.showDebug) {
								console.log('%cRun callback for ' + tool, 'color: #0d0;', 'Settings:', swConsent.tools[tool]);
							}

							swConsent.tools[tool].callback(swConsent, tool, ...args);
						}
						if(
							swConsent.tools[tool].granted !== undefined && 
							(
								swConsent.tools[tool].grantedFired === undefined ||
								swConsent.tools[tool].grantedFired === false
							)
						) {
							if (swConsent.showDebug) {
								console.log('%cRun granted-callback for ' + tool, 'color: #0d0;', 'Settings:', swConsent.tools[tool]);
							}

							for(let key in swConsent.tools[tool].granted) {
								let granted = swConsent.tools[tool].granted[key];
								if(typeof granted[0] !== 'function') {
									continue;
								}
								granted[0](swConsent, tool, ...granted[1]);
							}
							// swConsent.tools[tool].granted(swConsent, tool, ...args);
							swConsent.add(tool, {
								grantedFired: true,
								deniedFired: false
							});
						}
					} else if (swConsent.showDebug) {
						console.log('%c' + tool, 'color: #dd0', '%chas no callback yet, might be setup later!', 'color: #dd0');
					}
				} else {
					if(swConsent.showDebug) {
						console.log('Tool', tool, 'cannot be loaded, permissions denied!');
					}
					
					if(
						swConsent.tools[tool].denied !== undefined &&
						(
							swConsent.tools[tool].deniedFired === undefined ||
							swConsent.tools[tool].deniedFired === false
						)
					) {
						for(let key in swConsent.tools[tool].denied) {
							let denied = swConsent.tools[tool].denied[key];
							if(typeof denied[0] !== 'function') {
								console.log('CALL denied NO FUNCTION', key, tool, denied, swConsent.tools[tool]);
								continue;
							}
							denied[0](swConsent, tool, ...denied[1]);
						}
						// swConsent.tools[tool].denied(swConsent, tool, ...args);
						swConsent.add(tool, {
							deniedFired: true,
							grantedFired: false
						});
					}
				}
			},
			loadAllowedTools: function() {
				if(swConsent.tools !== undefined) {
					for(var tool in swConsent.tools) {
						swConsent.loadTool(tool);
					}
				} else if(swConsent.showDebug) {
					console.log('swConsent.tools seams to be undefined', window);
				}
			},
			onPermissionGranted: function(tool, options, ...args) {
				let data = {
					added: true,
					id: options.id,
					callbackArguments: args
				};

				if(options.granted !== undefined) {
					data.granted = {};
					data.granted[data.id] = [options.granted, args];
				}

				if(options.denied !== undefined) {
					data.denied = {};
					data.denied[data.id] = [options.denied, args];
				}

				swConsent.add(tool, data);

				return swConsent.tools[tool];
			},
			checkUserConsent: function(type) {
				var consentData = swConsent.getStorage('sw-consent-tool', true);

				if(
					!consentData ||
					consentData.saved === undefined ||
					consentData.permissions === undefined
				) {
					if(swConsent.showDebug) {
						console.log('swConsent not submitted yet');
					}
					return false;
				}

				if(
					consentData.permissions[type] === undefined ||
					!consentData.permissions[type]
				) {
					if(swConsent.showDebug) {
						console.log('swConsent submitted but not granted');
					}
					return false;
				}

				return true;
			},
			checkPermission(permission) {
				let data = swConsent.getStorage('sw-consent-tool', true);

				if(
					data.permissions !== undefined &&
					data.permissions[permission] !== undefined &&
					data.permissions[permission] == 1
				) {
					if(swConsent.showDebug) {
						console.log('%cPermission granted:', 'color: #0d0;', permission);
					}
					return true;
				}

				if(
					data.permissions !== undefined &&
					swConsent.tools !== undefined &&
					swConsent.tools[permission] !== undefined &&
					data.permissions[swConsent.tools[permission].type] !== undefined &&
					data.permissions[swConsent.tools[permission].type] == 1
				) {
					if(swConsent.showDebug) {
						console.log('%cGroup permission granted:', 'color: #0d0;', permission, swConsent.tools[permission]);
					}
					return true;
				}

				if(swConsent.showDebug) {
					console.log('%cPermission denied:', 'color: #d00;', permission);
				}

				return false;
			},
			getStorage: function(index) {
				var data = localStorage.getItem('sw-consent-settings'),
					parseJson = arguments[1]||false;

				if(data) {
					if(parseJson) {
						try {
							data = JSON.parse(data);
						} catch(e) {
							return false;
						}
					}

					return data;
				}

				return false;
			}
		});

		swConsent.extend({
			tools: {},
			disabled: false,
			ajaxData: {
				url: '/',
				method: 'POST',
				data: {}
			},
			// Custom HTML for Cookie Details
			cookieDetails: '',
			/**
			 * 'beforebegin'
			 *		Vor dem element selbst.
			 * 'afterbegin'
			 *		Innerhalb des element, direkt vor dessen erstem Kind-Objekt. 
			 * 'beforeend'
			 *		Innerhalb des element, direkt nach dessen letztem Kind-Objekt.
			 * 'afterend'
			 *		Nach dem element selbst.
			 */
			bodyPosition: 'beforeend',
			/**
			 * Show Details for cookies
			 */
			showDetailsDescription: true,
			/**
			 * Do not show again after save button
			 */
			showOnlyOnce: true,
			/**
			 * By pass setting, load everything
			 */
			loadAllTools: true,
			/**
			 * Like login cookies
			 */
			askForTechnicalCookies: false,
			/**
			 * Like youtube iframe
			 */
			askForExternal: true,
			/**
			 * Like analytics, & facebook pixel
			 */
			askForTrackingCookies: true,
			translations: {
				default: {}
			},
			/**
			 * Format: {title: 'Foo', link: 'https://foo.bar/imprint'}
			 */
			footerLinks: [
				{title: 'Impressum', link: '#impressum'},
				{title: 'Datenschutz', link: '#datenschutz'},
				{title: 'AGB', link: '#agb'},
			],
			consentTypes: [
				{type: 'external', label: 'Externe Inhalte'}, 
				{type: 'tracking', label: 'Tracking Coockies'}
			],
			template: `<div data-sw-consent-tool id="sw-consent-tool">
	<div class="modal fade" id="sw-consent-tool-modal" tabindex="-1" role="dialog">
		<div class="modal-dialog modal-dialog-centered" role="document">
			<div class="modal-content">
				<div class="modal-header">
					<div>
						<h2 class="modal-title">Wir verwenden jetzt Cookies</h2>
						<p>Sie können Ihre Zustimmung jederzeit widerrufen oder anpassen.</p>
					</div>
					<!--<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
						<span aria-hidden="true">&times;</span>
					</button>-->
				</div>
				<div class="modal-body">
					<form class="sw-consent-tool-inner row">
						<input type="checkbox" id="toggle_sw_consent_details" />
						<div class="sw_consent_general container">

							##technical_cookies##
							##required_cookies##

							<div class="row justify-content-sm-center sw-consent-btn-accept">
								<button type="button" class="col col-lg-6 btn btn-primary sw-consent-tool-consent-all">Alle akzeptieren</button>
							</div>
							<div class="row justify-content-sm-center sw-consent-btn-settings">
								<label for="toggle_sw_consent_details" class="col col-lg-6 btn btn-outline-secondary">Einstellungen</label>
							</div>
						</div>

						<div class="sw_consent_details">
							<div class="row justify-content-sm-center">
								<label for="toggle_sw_consent_details" class="col-sm-6 btn btn-outline-secondary">Einstellungen schließen</label>
							</div>

							##details_cookie##

							<div class="row justify-content-sm-center sw-consent-btn-details-container">
								<div class="col col-sm-5"><button type="button" class="btn btn-outline-secondary sw-consent-tool-save">Speichern</button></div>
								<div class="col col-sm-5"><button type="button" class="btn btn-primary sw-consent-tool-consent-all">Alle akzeptieren</button></div>
							</div>
						</div>
					</form>
				</div>
				##footer##
			</div>
		</div>
	</div>
</div>`,
			// Do not show popup
			hidePopup: (false && !(
				swConsent.urlContains('sw_consent_bar=1') ||
				swConsent.urlContains('local_gtm_bar=1')
			)),
			/** TAB Placeholder */
			showDebug: (
				swConsent.urlContains('gtm_debug=x') ||
				swConsent.urlContains('sw_consent_debug=1') ||
				swConsent.urlContains('local_gtm_debug=1')
			),
			gtm_id: (function() {
				var script = document.querySelector('script[src*="/consent.js?gtm_id="]'),
					source = script.getAttribute('src');

				return swConsent.urlQuery('gtm_id', source.substring(source.indexOf("?") + 1));
			})(),
		});

		return swConsent;
	})();

	window.swConsent = swConsent;
}));

window.dataLayer = window.dataLayer || [];
window.gtag = function(){dataLayer.push(arguments);}

gtag('consent', 'default', {
	'ad_storage': 'denied',
	'analytics_storage': 'denied',
	'wait_for_update': 1500
});

var head = document.getElementsByTagName('HEAD')[0]; 
var link = document.createElement('link');
link.rel = 'stylesheet'; 
link.type = 'text/css';
link.href = document.querySelector('script[src*="/consent.js?gtm_id="]').src.replace('.js', '.css'); 
head.appendChild(link);

/* Google Tag Manager */
window.swConsent_lastGtmTagDone = new CustomEvent('swConsent_lastGtmTagDone');
window.swConsent_loadConsentTool = new CustomEvent('swConsent_loadConsentTool');
window.swConsent_done = new CustomEvent('swConsent_done');

(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;
f.parentNode.insertBefore(j,f);
// if(swConsent.showDebug) {console.log('ASD');}
})(window,document,'script','dataLayer', swConsent.gtm_id);

if(swConsent.showDebug) {
	console.log('Load sw consent tool');
}

// /* End Google Tag Manager */
window.addEventListener('swConsent_done', function() {
    // Google Tag Manager has been loaded
	if(swConsent.showDebug) {
		console.log('All gtm tags are loaded');
	}

	swConsent.loadAllowedTools();

	if(!swConsent.disabled) {
		let template = document.getElementById('sw-consent-tool');
		if(template) {
			swConsent.showContsentBar();
		} else {
			document.addEventListener("DOMContentLoaded", function(event) {
				swConsent.showContsentBar();
			});
		}
	}
});
