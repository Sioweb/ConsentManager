(function (window) {
	var swConsent = (function () {
		var swConsent = function (sel, context) {
			return new swConsent.fn.newConsent(sel, context);
		},
		msg = {},
		expr;

		swConsent.fn = swConsent.prototype = {
			constructor: swConsent,
			newConsent: function (sel, context) {
				var match, elem;

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
			var base = {},
				options = arguments[0] || {};

			if (arguments[1] == undefined && typeof arguments[1] != "boolean")
				base = this;

			for (var i = 0; i < arguments.length; i++)
				if (arguments[i] != null)
					for (value in arguments[i])
						base[value] = arguments[i][value];

			return base;
		};

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
			checkUserConsent: function(type) {
				var consentData = swConsent.getStorage('sw-consent-tool', true);

				if(
					!consentData ||
					consentData.saved === undefined ||
					consentData.permissions === undefined
				) {
					return false;
				}

				if(
					consentData.permissions[type] === undefined ||
					!consentData.permissions[type]
				) {
					return false;
				}

				return true;
			}
		});

		swConsent.extend({
			loadAllowedTools: function() {
				if(window.gtm_consent_tags !== undefined) {
					for(var tool in window.gtm_consent_tags) {
						if(swConsent.urlContains('local_gtm_bar=1')) {
							if(swConsent.checkUserConsent(tool)) {
								if(swConsent.showDebug) {
									console.log('load', tool, 'tool');
								}
								window.gtm_consent_tags[tool]();
							} else if(swConsent.showDebug) {
								console.log('Tool', tool, 'cannot be loaded, permissions denied!');
							}
						} else {
							window.gtm_consent_tags[tool]();
							if(swConsent.showDebug) {
								console.log('tool', tool, 'loaded');
							}
						}
					}
				} else if(swConsent.showDebug) {
					console.log('window.gtm_consent_tags seams to be undefined', window);
				}
			}
		});

		swConsent.extend({
			showContsentBar: function () {
                window.addEventListener('load', function() {
                    var template = ''
						$template = null,
						settingsDone = swConsent.getStorage('sw-consent-tool', true);

					if(settingsDone.saved) {
						return;
					}

                    template += '<div class="sw-consent-tool">';
						template += '<form class="sw-consent-tool-inner row">';
							template += '<div class="col-sm-2">';
								template += '<label for="sw-consent-tool-type-basic">Essentielle Cookies?';
									template += '<input id="sw-consent-tool-type-basic" name="sw_consent_tool[basic]" type="checkbox" value="1" checked readonly>';
								template += '</label>';
							template += '</div>';
							template += '<div class="col-sm-2">';
								template += '<label for="sw-consent-tool-type-fbq">Tracking zulassen?'
									template += '<input id="sw-consent-tool-type-fbq" name="sw_consent_tool[fbq]" type="checkbox" value="1">';
								template += '</label>'
							template += '</div>';
							template += '<div class="col-sm">';
								template += '<input type="submit" value="Speichern"/>';
                    		template += '</div>';
                    	template += '</form>';
                    template += '</div>';

                    document.body.insertAdjacentHTML('afterbegin', template);
					$template = document.body.getElementsByClassName('sw-consent-tool')[0];

					Object.assign($template.style,{
						position: 'fixed',
						bottom: 0,
						left: 0,
						right: 0,
						padding: '20px',
						height: '100px',
						background: '#ccc',
						zIndex: '99999999',
						boxSizing: 'border-box'
					});


					$template
						.getElementsByTagName('form')[0]
						.addEventListener('submit', function(e) {
							var formData = new FormData(this),
								oDataset = swConsent.getStorage('sw-consent-tool', true);
							
							e.preventDefault();

							if(!oDataset) {
								oDataset = {
									saved: true,
									permissions:{}
								};
							}
							if(oDataset.permissions === undefined) {
								oDataset.permissions = {}
							}

							formData.forEach(function(value, fieldName) {
								var rx = /\[([^\]]*)\]/g;
								oDataset.permissions[rx.exec(fieldName)[1]] = value;
							});

							oDataset.saved = true;
							localStorage.setItem('sw-consent-tool', JSON.stringify(oDataset));
							$template.remove();

							swConsent.loadAllowedTools();
						})
                });
			}
        });

		swConsent.extend({
			getStorage: function(index) {
				var data = localStorage.getItem('sw-consent-tool'),
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
			showDebug: (
				swConsent.urlContains('gtm_debug=x') ||
				swConsent.urlContains('local_gtm_debug=1')
			),
			gtm_id: (function() {
				var script = document.querySelector('script[src*="consent.js"]'),
					source = script.getAttribute('src');

				return swConsent.urlQuery('gtm_id', source.substring(source.indexOf("?") + 1));
			})()
		});

		return swConsent;
	})();

	window.swConsent = swConsent;
})(window);


if(swConsent.urlContains('local_gtm_bar=1')) {
    swConsent.showContsentBar();
}

/* Google Tag Manager */
window.lastGtmTagDone = new CustomEvent('last_gtm_tag_done');
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;

j.addEventListener('load', function() {
    var _ge = new CustomEvent('gtm_loaded', { bubbles: true });
    d.dispatchEvent(_ge);
});

f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer', swConsent.gtm_id);
/* End Google Tag Manager */

window.addEventListener('last_gtm_tag_done', function() {
    // Google Tag Manager has been loaded
    if(swConsent.showDebug) {
        console.log('All gtm tags are loaded');
    }
    
	swConsent.loadAllowedTools();
});
